package updateStatus

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
)

func UpdateGroupStatus(c *gin.Context) {
	var groupProjectStatus entity.GroupProject
	id := c.Param("id")
	if err := c.ShouldBindJSON(&groupProjectStatus); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	db := database.DB()

	// เริ่ม Transaction
	tx := db.Begin()

	// 1. อัปเดตสถานะกลุ่มเป็น Completed โดยตรวจสอบ TeacherID ด้วย
	result := tx.Model(&entity.GroupProject{}).Where("id = ? AND teacher_id = ?", id, claims.ID).Update("group_status", "Completed")
	if result.Error != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update group status: " + result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		tx.Rollback()
		c.JSON(http.StatusForbidden, gin.H{"error": "Group not found or you are not authorized to update this group"})
		return
	}

	// 2. Calculate scores and update Pass status
	// 2.1 Calculate Group Scores
	var groupResults []entity.EvaResult
	if err := tx.Preload("Criteria.Evaluation").
		Joins("JOIN appointments ON appointments.id = eva_results.appointment_id").
		Where("appointments.group_project_id = ?", id).
		Find(&groupResults).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch group results"})
		return
	}

	groupScoresMap := make(map[string]map[uint]float64)
	for _, res := range groupResults {
		if res.Criteria == nil || res.Criteria.Evaluation == nil {
			continue
		}
		evalName := res.Criteria.Evaluation.Name
		teacherID := res.TeacherID

		if groupScoresMap[evalName] == nil {
			groupScoresMap[evalName] = make(map[uint]float64)
		}
		groupScoresMap[evalName][teacherID] += res.Score
	}

	var totalGroupScore float64 = 0
	for _, teachersScores := range groupScoresMap {
		var sumScore float64 = 0
		teacherCount := 0
		for _, score := range teachersScores {
			sumScore += score
			teacherCount++
		}
		if teacherCount > 0 {
			totalGroupScore += sumScore / float64(teacherCount)
		}
	}

	// 2.2 Calculate Individual Scores and Update Pass Status
	var members []entity.GroupMember
	if err := tx.Where("group_project_id = ?", id).Find(&members).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch group members"})
		return
	}

	for _, member := range members {
		var indResults []entity.IndividualScore
		if err := tx.Preload("Criteria.Evaluation").
			Joins("JOIN appointments ON appointments.id = individual_scores.appointment_id").
			Where("appointments.group_project_id = ? AND individual_scores.student_id = ?", id, member.StudentID).
			Find(&indResults).Error; err != nil {
			continue
		}

		studentEvalScores := make(map[string][]float64)
		for _, res := range indResults {
			if res.Criteria == nil || res.Criteria.Evaluation == nil {
				continue
			}
			evalName := res.Criteria.Evaluation.Name
			studentEvalScores[evalName] = append(studentEvalScores[evalName], res.Score)
		}

		var myTotalIndScore float64 = 0
		for _, scores := range studentEvalScores {
			sum := 0.0
			for _, s := range scores {
				sum += s
			}
			if len(scores) > 0 {
				myTotalIndScore += sum / float64(len(scores))
			}
		}

		grandTotal := totalGroupScore + myTotalIndScore

		// Update Pass status if score >= 50
		if grandTotal >= 50 {
			if err := tx.Model(&entity.User{}).Where("id = ?", member.StudentID).Update("pass", true).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update student pass status"})
				return
			}
		}
	}

	// Commit Transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction: " + err.Error()})
		return
	}

	if err := db.Where("id = ?", id).First(&groupProjectStatus).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Failed to updated group status: " + err.Error()})
		return
	}
	log.InsertLog(c, 28)
	c.JSON(http.StatusOK, gin.H{"message": "Group status updated successfully", "data": groupProjectStatus})
}
