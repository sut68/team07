package evaluation

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
)

type EvaluationSaveRequest struct {
	AppointmentID uint `json:"appointment_id"`

	GroupScores []struct {
		CriteriaID      uint    `json:"criteria_id"`
		CriteriaLevelID *uint   `json:"criteria_level_id"`
		Score           float64 `json:"score"`
		Comment         string  `json:"comment"`
	} `json:"group_scores"`

	IndividualScores []struct {
		StudentID       uint    `json:"student_id"`
		CriteriaID      uint    `json:"criteria_id"`
		CriteriaLevelID *uint   `json:"criteria_level_id"`
		Score           float64 `json:"score"`
	} `json:"individual_scores"`
}

func SaveEvaluation(c *gin.Context) {
	var req EvaluationSaveRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := database.DB()
	tx := db.Begin()

	if err := tx.Where("appointment_id = ? AND teacher_id = ?", req.AppointmentID, claims.ID).
		Delete(&entity.EvaResult{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear old group scores"})
		return
	}

	if err := tx.Where("appointment_id = ? AND teacher_id = ?", req.AppointmentID, claims.ID).
		Delete(&entity.IndividualScore{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear old individual scores"})
		return
	}

	for _, item := range req.GroupScores {
		evaResult := entity.EvaResult{
			Score:           item.Score,
			Comment:         item.Comment,
			Date:            time.Now(),
			CriteriaID:      item.CriteriaID,
			CriteriaLevelID: item.CriteriaLevelID,
			AppointmentID:   req.AppointmentID,
			TeacherID:       claims.ID,
		}
		if err := tx.Create(&evaResult).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save group score: " + err.Error()})
			return
		}
	}

	for _, item := range req.IndividualScores {
		apptID := req.AppointmentID
		indScore := entity.IndividualScore{
			Score:           item.Score,
			CriteriaID:      item.CriteriaID,
			CriteriaLevelID: item.CriteriaLevelID,
			AppointmentID:   &apptID,
			TeacherID:       claims.ID,
			StudentID:       item.StudentID,
		}
		if err := tx.Create(&indScore).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save individual score: " + err.Error()})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Evaluation saved successfully!"})
}