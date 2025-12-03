package appointment

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
	"gorm.io/gorm"
)

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
	var groups []entity.GroupProject
	db := database.DB()

	query := db.Select("id", "group_number",  "group_status").
		Where("group_status IN ?", []string{"Pending", "In Process"})

	if keyword != "" {
		query = query.Where("name_project LIKE ? OR CAST(group_number AS TEXT) LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

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