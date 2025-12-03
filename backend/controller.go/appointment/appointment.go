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

type AppointmentResponse struct {
	ID                uint      `json:"id"`
	StartDateTime     time.Time `json:"start_date_time"`
	DurationMin       uint      `json:"duration_min"`
	AppointmentStatus string    `json:"appointment_status"`
	TypeName    string `json:"type_name"`
	RoomName    string `json:"room_name"`
	Location    string `json:"location"`
	GroupName   string `json:"group_name"`
	TeacherName string `json:"teacher_name"`
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
		Preload("Room", func(db *gorm.DB) *gorm.DB {return db.Select("id", "name", "location")}).
		Preload("AppointmentType", func(db *gorm.DB) *gorm.DB {return db.Select("id", "name")}).
		Preload("GroupProject", func(db *gorm.DB) *gorm.DB {return db.Select("id", "group_number", "group_status")}).
		Preload("Teacher", func(db *gorm.DB) *gorm.DB {return db.Select("id", "username", "firstname", "lastname")}).
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
			"group_number":         apt.GroupProject.GroupNumber, 
			"teacher_name":       apt.Teacher.Firstname + " " + apt.Teacher.Lastname,
		}
		response = append(response, item)
	}

	c.JSON(http.StatusOK, response)
}