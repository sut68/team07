package appointment

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
)

func SearchGroup(c *gin.Context) {
	keyword := c.Query("keyword")
	typeID := c.Query("type_id")
	mode := c.Query("mode")

	claims, _ := middleware.GetClaimsFromContext(c)
	db := database.DB()

	query := db.Select("id", "group_number", "group_status")

	if mode == "manual" {
		query = query.Where("teacher_id = ?", claims.ID)
	} else if typeID == "3" {
		// Committee can see all groups
	} else {
		query = query.Where("teacher_id = ?", claims.ID)
	}

	query = query.Where("group_status IN ?", []string{"Pending", "In Process"})

	if keyword != "" {
		query = query.Where("name_project LIKE ? OR CAST(group_number AS TEXT) LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}
	var groups []entity.GroupProject
	if err := query.Find(&groups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	response := []gin.H{}
	for _, g := range groups {
		response = append(response, gin.H{
			"id":           g.ID,
			"group_number": g.GroupNumber,
			"group_status": g.GroupStatus,
		})
	}
	c.JSON(http.StatusOK, response)
}

func DeleteAppointment(c *gin.Context) {
	id := c.Param("id")
	db := database.DB()

	var apt entity.Appointment
	claims, _ := middleware.GetClaimsFromContext(c)

	if err := db.Where("id = ? AND teacher_id = ?", id, claims.ID).First(&apt).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found or permission denied"})
		return
	}
	tx := db.Begin()

	if err := tx.Delete(&apt).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete appointment"})
		return
	}

	// ตรวจสอบสถานะปัจจุบันของกลุ่มก่อนที่จะทำการ Revert
	var currentGroup entity.GroupProject
	if err := tx.First(&currentGroup, apt.GroupProjectID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Group Project not found"})
		return
	}

	// ถ้าสถานะเป็น Completed แล้ว ไม่ต้องเปลี่ยนกลับเป็น Pending
	if currentGroup.GroupStatus != "Completed" {
		if err := tx.Model(&entity.GroupProject{}).
			Where("id = ?", apt.GroupProjectID).
			Update("group_status", "Pending").Error; err != nil {

			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to revert group status"})
			return
		}
	}

	tx.Commit()
	log.InsertLog(c, 14)
	c.JSON(http.StatusOK, gin.H{"message": "Appointment deleted successfully"})
}

func CreateAppointment(c *gin.Context) {
	var appointment entity.Appointment

	if err := c.ShouldBindJSON(&appointment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	appointment.TeacherID = claims.ID
	appointment.AppointmentStatus = "scheduled"
	db := database.DB()

	// ตรวจสอบสถานะกลุ่มก่อนสร้างนัดหมาย
	var groupProject entity.GroupProject
	if err := db.Select("id, teacher_id, group_status").First(&groupProject, appointment.GroupProjectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group Project not found"})
		return
	}

	if groupProject.GroupStatus != "Pending" && groupProject.GroupStatus != "In Process" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่สามารถสร้างนัดหมายสำหรับกลุ่มที่จบการศึกษาแล้วได้"})
		return
	}

	fmt.Printf("DEBUG: Creating Appointment - TypeID: %d, GroupID: %d, EvalID: %v\n",
		appointment.AppointmentTypeID, appointment.GroupProjectID, appointment.EvaluationID)

	if appointment.AppointmentTypeID != 3 {
		if groupProject.TeacherID == nil || *groupProject.TeacherID != claims.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "You are not the advisor of this group."})
			return
		}
	} else {
		if appointment.EvaluationID == nil {
			var committeeEval entity.Evaluation
			if err := db.Where("name = ?", "Committee Evaluation").First(&committeeEval).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Committee Evaluation not found"})
				return
			}
			appointment.EvaluationID = &committeeEval.ID
		}
	}

	var existingAppt entity.Appointment
	if tx := db.Where("group_project_id = ? AND appointment_status = 'scheduled'", appointment.GroupProjectID).
		First(&existingAppt); tx.RowsAffected > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กลุ่มนี้มีการนัดหมายที่ยังไม่เสร็จสิ้นอยู่ กรุณายกเลิกหรือลบนัดเดิมก่อนจึงจะสร้างนัดใหม่ได้"})
		return
	}

	// Calculate End Time for Overlap Check
	newStartTime := appointment.StartDateTime
	newEndTime := newStartTime.Add(time.Duration(appointment.DurationMin) * time.Minute)

	// 1. Check Room Conflict (Overlap)
	var roomConflict int64
	if err := db.Model(&entity.Appointment{}).
		Where("room_id = ? AND appointment_status = 'scheduled'", appointment.RoomID).
		Where("start_date_time < ? AND (start_date_time + (duration_min * interval '1 minute')) > ?", newEndTime, newStartTime).
		Count(&roomConflict).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if roomConflict > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ห้องนี้ถูกจองในช่วงเวลาดังกล่าวแล้ว"})
		return
	}

	// 2. Check Teacher Conflict (Overlap)
	var teacherConflict int64
	if err := db.Model(&entity.Appointment{}).
		Where("teacher_id = ? AND appointment_status = 'scheduled'", claims.ID).
		Where("start_date_time < ? AND (start_date_time + (duration_min * interval '1 minute')) > ?", newEndTime, newStartTime).
		Count(&teacherConflict).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if teacherConflict > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "คุณมีนัดหมายอื่นในช่วงเวลานี้แล้ว"})
		return
	}

	if appointment.StartDateTime.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่สามารถสร้างนัดหมายย้อนหลังได้"})
		return
	}
	tx := db.Begin()

	if err := tx.Create(&appointment).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx.Commit()
	log.InsertLog(c, 15)
	c.JSON(http.StatusCreated, gin.H{"message": "Appointment created successfully", "data": appointment})
}

func UpdateAppointment(c *gin.Context) {
	var payload entity.Appointment
	id := c.Param("id")

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := database.DB()

	var existingAppt entity.Appointment
	if err := db.Where("id = ? AND teacher_id = ?", id, claims.ID).First(&existingAppt).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found or permission denied"})
		return
	}

	// Check if GroupProjectID is changing, if so, clear old evaluation results
	if payload.GroupProjectID != 0 && payload.GroupProjectID != existingAppt.GroupProjectID {
		if err := db.Where("appointment_id = ?", existingAppt.ID).Delete(&entity.EvaResult{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear old evaluation results"})
			return
		}
		if err := db.Where("appointment_id = ?", existingAppt.ID).Delete(&entity.IndividualScore{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear old individual scores"})
			return
		}
	}

	if err := db.Model(&existingAppt).Updates(payload).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update appointment: " + err.Error()})
		return
	}
	log.InsertLog(c, 16)
	c.JSON(http.StatusOK, gin.H{"message": "Appointment updated successfully", "data": existingAppt})
}

func CreateRoom(c *gin.Context) {
	var room entity.Room
	if err := c.ShouldBindJSON(&room); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.DB()
	if err := db.Create(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.InsertLog(c, 17)
	c.JSON(http.StatusCreated, gin.H{"data": room})
}

func AutoCreateAppointments(c *gin.Context) {
	var req AutoScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.StartDateTime.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่สามารถสร้างนัดหมายย้อนหลังได้"})
		return
	}

	claims, _ := middleware.GetClaimsFromContext(c)
	db := database.DB()

	var validSlots []time.Time
	currentTime := req.StartDateTime

	loc := time.FixedZone("ICT", 7*60*60)

	for currentTime.Add(time.Duration(req.DurationMin)*time.Minute).Before(req.EndDateTime) ||
		currentTime.Add(time.Duration(req.DurationMin)*time.Minute).Equal(req.EndDateTime) {

		localTime := currentTime.In(loc)
		startHour := localTime.Hour()
		startMin := localTime.Minute()
		slotStartMins := (startHour * 60) + startMin
		slotEndMins := slotStartMins + req.DurationMin
		lunchStartMins := 12 * 60
		lunchEndMins := 13 * 60

		if slotStartMins < lunchEndMins && slotEndMins > lunchStartMins {
			currentTime = currentTime.Add(time.Duration(req.DurationMin) * time.Minute)
			continue
		}
		var conflict int64
		db.Model(&entity.Appointment{}).
			Where("room_id = ? AND start_date_time = ? AND appointment_status = 'scheduled'", req.RoomID, currentTime).
			Count(&conflict)

		if conflict == 0 {
			validSlots = append(validSlots, currentTime)
		}

		currentTime = currentTime.Add(time.Duration(req.DurationMin) * time.Minute)
	}

	if len(validSlots) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No available slots found in this range."})
		return
	}

	subQuery := db.Model(&entity.Appointment{}).
		Select("group_project_id").
		Where("appointment_status = ? AND appointment_type_id = ?", "scheduled", req.AppointmentTypeID)

	var groups []entity.GroupProject
	if err := db.Where("group_status IN ?", []string{"Pending", "In Process"}).
		Where("id NOT IN (?)", subQuery).
		Order("RANDOM()").
		Limit(len(validSlots)).
		Find(&groups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch groups"})
		return
	}

	if len(groups) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No pending groups left to schedule!"})
		return
	}

	tx := db.Begin()
	count := 0

	for i, group := range groups {
		slotTime := validSlots[i]

		appt := entity.Appointment{
			StartDateTime:     slotTime,
			DurationMin:       uint(req.DurationMin),
			AppointmentStatus: "scheduled",
			RoomID:            req.RoomID,
			AppointmentTypeID: req.AppointmentTypeID,
			TeacherID:         claims.ID,
			GroupProjectID:    group.ID,
		}

		if req.AppointmentTypeID == 3 {
			var committeeEval entity.Evaluation
			if err := db.Where("name = ?", "Committee Evaluation").First(&committeeEval).Error; err == nil {
				appt.EvaluationID = &committeeEval.ID
			} else {
				evalID := uint(4)
				appt.EvaluationID = &evalID
			}
		}

		if err := tx.Create(&appt).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create appointments"})
			return
		}

		count++
	}

	tx.Commit()
	log.InsertLog(c, 15)
	c.JSON(http.StatusCreated, gin.H{
		"message":       "Auto-scheduled successfully!",
		"groups_booked": count,
		"slots_found":   len(validSlots),
	})
}
