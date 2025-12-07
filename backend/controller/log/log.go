package log

import (
	"net/http"



	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
)

func InsertLog(c * gin.Context, x uint) {
	
	db := database.DB()

	claims, err := middleware.GetClaimsFromContext(c)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "failed: Claims missing"})
        return
    }


	log := []entity.Log{
		{	
			UserID: 		claims.ID, 
			ActionTypeID: 	x, 
		},
	}

	db.Create(&log)

}

func InsertLogByUserID(c *gin.Context, userID uint, actionTypeID uint) {
	db := database.DB()

	log := []entity.Log{
		{
			UserID:      userID,
			ActionTypeID: actionTypeID,
		},
	}

	db.Create(&log)
}