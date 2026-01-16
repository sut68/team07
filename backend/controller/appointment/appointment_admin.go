package appointment

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
)

func CreateAppointmentType(c *gin.Context) {
	var appointmentType entity.AppointmentType

	if err := c.ShouldBindJSON(&appointmentType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.DB()

	// Check if appointment type name already exists
	var existingType entity.AppointmentType
	if err := db.Where("name = ?", appointmentType.Name).First(&existingType).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Appointment type already exists"})
		return
	}

	if err := db.Create(&appointmentType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.InsertLog(c, 18)
	c.JSON(http.StatusCreated, gin.H{"data": appointmentType, "message": "Created successfully"})
}

func DeleteAppointmentType(c *gin.Context) {
	id := c.Param("id")
	db := database.DB()

	var appointmentType entity.AppointmentType
	if err := db.First(&appointmentType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment type not found"})
		return
	}

	if appointmentType.Name == "Final Defense" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete appointment type 'Final Defense'"})
		return
	}

	var count int64
	db.Model(&entity.Appointment{}).Where("appointment_type_id = ?", id).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete appointment type with existing appointments"})
		return
	}

	if err := db.Delete(&entity.AppointmentType{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.InsertLog(c, 19)
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}
