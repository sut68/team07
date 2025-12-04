package appointment

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
	"gorm.io/gorm"
)

type AutoScheduleRequest struct {
	StartDateTime     time.Time `json:"start_date_time"`
	EndDateTime       time.Time `json:"end_date_time"`
	DurationMin       int       `json:"duration_min"`
	RoomID            uint      `json:"room_id"`
	AppointmentTypeID uint      `json:"appointment_type_id"`
}

func ListAppointments(c *gin.Context) {
	var appointments []entity.Appointment

	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: " + err.Error()})
		return
	}

	db := database.DB()

	results := db.
		Preload("Room", func(db *gorm.DB) *gorm.DB { return db.Select("id", "name", "location") }).
		Preload("AppointmentType", func(db *gorm.DB) *gorm.DB { return db.Select("id", "name") }).
		Preload("GroupProject", func(db *gorm.DB) *gorm.DB { return db.Select("id", "group_number", "group_status") }).
		Preload("Teacher", func(db *gorm.DB) *gorm.DB { return db.Select("id", "username", "firstname", "lastname") }).
		Joins("JOIN users ON users.id = appointments.teacher_id").
		Where("appointments.teacher_id = ?", claims.ID).
		Or("appointments.appointment_type_id = ? AND users.branch_id = ?", 3, claims.BranchID).
		Find(&appointments)

	if results.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": results.Error.Error()})
		return
	}

	response := []map[string]interface{}{}

	for _, apt := range appointments {
		item := gin.H{
			"id":                 apt.ID,
			"start_date_time":    apt.StartDateTime,
			"duration_min":       apt.DurationMin,
			"appointment_status": apt.AppointmentStatus,
			"type_name":          apt.AppointmentType.Name,
			"room_name":          apt.Room.Name,
			"location":           apt.Room.Location,
			"group_number":       apt.GroupProject.GroupNumber,
			"teacher_name":       apt.Teacher.Firstname + " " + apt.Teacher.Lastname,
		}
		response = append(response, item)
	}

	c.JSON(http.StatusOK, response)
}

func GetAppointment(c *gin.Context) {
	id := c.Param("id")
	var apt entity.Appointment
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: " + err.Error()})
		return
	}

	db := database.DB()

	err = db.
		Preload("Room", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name", "location")
		}).
		Preload("AppointmentType", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name")
		}).
		Preload("GroupProject", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "group_number", "group_status")
		}).
		Preload("Teacher", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "username", "firstname", "lastname", "phone", "email")
		}).
		Joins("JOIN users ON users.id = appointments.teacher_id").
		Where("appointments.id = ?", id).
		Where(
			db.Where("appointments.teacher_id = ?", claims.ID).
				Or("appointments.appointment_type_id = ? AND users.branch_id = ?", 3, claims.BranchID),
		).
		First(&apt).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":                 apt.ID,
		"start_date_time":    apt.StartDateTime,
		"duration_min":       apt.DurationMin,
		"appointment_status": apt.AppointmentStatus,

		"type_id":   apt.AppointmentType.ID,
		"type_name": apt.AppointmentType.Name,

		"room_id":   apt.Room.ID,
		"room_name": apt.Room.Name,
		"location":  apt.Room.Location,

		"group_project_id": apt.GroupProject.ID,
		"group_number":     apt.GroupProject.GroupNumber,
		"group_status":     apt.GroupProject.GroupStatus,

		"teacher_id":    apt.Teacher.ID,
		"teacher_name":  apt.Teacher.Firstname + " " + apt.Teacher.Lastname,
		"teacher_email": apt.Teacher.Email,
		"teacher_phone": apt.Teacher.Phone,
	})
}

func ListRooms(c *gin.Context) {
	var rooms []entity.Room
	db := database.DB()

	if err := db.Select("id", "name", "location", "capacity").Find(&rooms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := []gin.H{}
	for _, room := range rooms {
		response = append(response, gin.H{
			"id":       room.ID,
			"name":     room.Name,
			"location": room.Location,
			"capacity": room.Capacity,
		})
	}

	c.JSON(http.StatusOK, response)
}

func ListAppointmentTypes(c *gin.Context) {
	var types []entity.AppointmentType
	db := database.DB()

	if err := db.Select("id", "name").Find(&types).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := []gin.H{}
	for _, t := range types {
		response = append(response, gin.H{
			"id":   t.ID,
			"name": t.Name,
		})
	}

	c.JSON(http.StatusOK, response)
}

func SearchGroup(c *gin.Context) {
	keyword := c.Query("keyword")

	claims, _ := middleware.GetClaimsFromContext(c)
	db := database.DB()

	query := db.Select("id", "group_number", "group_status").
		Where("group_status IN ?", []string{"Pending", "In Process"}).
		Where("teacher_id = ?", claims.ID)

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

	if err := tx.Model(&entity.GroupProject{}).
		Where("id = ?", apt.GroupProjectID).
		Update("group_status", "In Process").Error; err != nil {

		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to revert group status"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Appointment deleted successfully"})
}

func GetRandomGroup(c *gin.Context) {
	var group entity.GroupProject
	db := database.DB()

	if err := db.Preload("Teacher").
		Where("group_status IN ?", []string{"Pending", "In Process"}).
		Order("RANDOM()").
		First(&group).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{"error": "No pending groups available"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           group.ID,
		"group_number": group.GroupNumber,
		"advisor_id":   group.TeacherID,
		"advisor_name": group.Teacher.Firstname + " " + group.Teacher.Lastname,
	})
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
	db := database.DB()

	if appointment.AppointmentTypeID != 3 {
		var groupProject entity.GroupProject
		if err := db.Select("teacher_id").First(&groupProject, appointment.GroupProjectID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Group Project not found"})
			return
		}

		// TeacherID == nil ยังไม่มีการเลือกอาจารย์
		if groupProject.TeacherID == nil || *groupProject.TeacherID != claims.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "You are not the advisor of this group."})
			return
		}
	}

	var existingAppt entity.Appointment
	if tx := db.Where("group_project_id = ? AND appointment_status = 'scheduled'", appointment.GroupProjectID).
		First(&existingAppt); tx.RowsAffected > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This group already has a scheduled appointment."})
		return
	}

	var conflictAppt entity.Appointment
	if tx := db.Where("room_id = ? AND start_date_time = ? AND appointment_status = 'scheduled'", appointment.RoomID, appointment.StartDateTime).
		First(&conflictAppt); tx.RowsAffected > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "The room is not available at this time."})
		return
	}

	tx := db.Begin()

	if err := tx.Create(&appointment).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := tx.Model(&entity.GroupProject{}).Where("id = ?", appointment.GroupProjectID).
		Update("group_status", "Scheduled").Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update group status"})
		return
	}

	tx.Commit()
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
	if err := db.Model(&existingAppt).Updates(payload).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update appointment: " + err.Error()})
		return
	}

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

	c.JSON(http.StatusCreated, gin.H{"data": room})
}

func AutoCreateAppointments(c *gin.Context) {
	var req AutoScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims, _ := middleware.GetClaimsFromContext(c)
	db := database.DB()

	var validSlots []time.Time
	currentTime := req.StartDateTime

	for currentTime.Add(time.Duration(req.DurationMin)*time.Minute).Before(req.EndDateTime) ||
		currentTime.Add(time.Duration(req.DurationMin)*time.Minute).Equal(req.EndDateTime) {

		startHour := currentTime.Hour()
		startMin := currentTime.Minute()
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

	var groups []entity.GroupProject
	if err := db.Where("group_status IN ?", []string{"Pending", "In Process"}).
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
		if err := tx.Create(&appt).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create appointments"})
			return
		}

		if err := tx.Model(&entity.GroupProject{}).Where("id = ?", group.ID).Update("group_status", "Scheduled").Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update group status"})
			return
		}
		count++
	}

	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"message":       "Auto-scheduled successfully!",
		"groups_booked": count,
		"slots_found":   len(validSlots),
	})
}
