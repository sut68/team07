package users

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"net/http"
)

func GetGender(c *gin.Context) {
	db := database.DB()
	var genders []entity.Gender

	db.Find(&genders)

	c.JSON(http.StatusOK, &genders)
}
