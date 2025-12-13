package appointment

import (
	"fmt"
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

    advisorName := ""
    if group.Teacher != nil {
        advisorName = group.Teacher.Firstname + " " + group.Teacher.Lastname
    }

    c.JSON(http.StatusOK, gin.H{
        "id":           group.ID,
        "group_number": group.GroupNumber,
        "advisor_id":   group.TeacherID,
        "advisor_name": advisorName,
    })
}


func GetMyProjectAndAppointment(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := database.DB()
	var member entity.GroupMember

	if err := db.Preload("GroupProject").
		Preload("GroupProject.Teacher").
		Preload("GroupProject.TopicSelections.Topic").
		Where("student_id = ?", claims.ID).
		First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "You do not belong to any project group."})
		return
	}

	groupID := member.GroupProjectID
	group := member.GroupProject

	var appointment entity.Appointment
	apptFound := false
	if err := db.Preload("Room").Preload("AppointmentType").
		Where("group_project_id = ? AND appointment_status IN ?", groupID, []string{"scheduled", "completed"}).
		Order("start_date_time DESC").
		First(&appointment).Error; err == nil {
		apptFound = true
	}

	projectName := fmt.Sprintf("Group %d", group.GroupNumber)
	if len(group.TopicSelections) > 0 && group.TopicSelections[0].Topic != nil {
		projectName = group.TopicSelections[0].Topic.Title
	}

	response := gin.H{
		"group_id":     group.ID,
		"group_number": group.GroupNumber,
		"project_name": projectName,
		"advisor_name": group.Teacher.Firstname + " " + group.Teacher.Lastname,

		"appointment": nil,
	}

	if apptFound {
		response["appointment"] = gin.H{
			"type":      appointment.AppointmentType.Name,
			"date_time": appointment.StartDateTime,
			"room":      appointment.Room.Name,
			"location":  appointment.Room.Location,
		}
	}

	c.JSON(http.StatusOK, response)
}
