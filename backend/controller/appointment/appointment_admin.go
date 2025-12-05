package appointment

import (
	"net/http"

	"github.com/gin-gonic/gin"
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

	if err := db.Create(&appointmentType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": appointmentType, "message": "Created successfully"})
}

func DeleteAppointmentType(c *gin.Context) {
	id := c.Param("id")
	db := database.DB()

	if err := db.Delete(&entity.AppointmentType{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}