package evaluation

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
	"gorm.io/gorm"
)

func ListEvaluationProjects(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	typeIDStr := c.Query("type_id")
	var filterTypeID int
	if typeIDStr != "" {
		filterTypeID, _ = strconv.Atoi(typeIDStr)
	}

	db := database.DB()
	var projects []entity.GroupProject

	if err := db.
		Preload("TopicSelections", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Preload("TopicSelections.Topic").
		Where("teacher_id = ?", claims.ID).
		Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := []map[string]interface{}{}

	for _, p := range projects {
		projectName := fmt.Sprintf("Group %d", p.GroupNumber)

		if len(p.TopicSelections) > 0 {
			selection := p.TopicSelections[0]
			if selection.Topic != nil {
				projectName = selection.Topic.Title
			}
		}

		var count int64
		query := db.Model(&entity.EvaResult{}).
			Joins("JOIN appointments ON appointments.id = eva_results.appointment_id").
			Where("appointments.group_project_id = ? AND eva_results.teacher_id = ?", p.ID, claims.ID)

		if filterTypeID > 0 {
			query = query.Where("appointments.appointment_type_id = ?", filterTypeID)
		}

		query.Count(&count)

		isGraded := count > 0
		statusText := "Pending"
		if isGraded {
			statusText = "Graded"
		}

		item := gin.H{
			"id":           p.ID,
			"group_number": p.GroupNumber,
			"project_name": projectName,
			"status":       statusText,
			"is_graded":    isGraded,
		}
		response = append(response, item)
	}

	c.JSON(http.StatusOK, response)
}
