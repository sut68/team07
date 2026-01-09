package evaluation

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
)

type EvaluationSaveRequest struct {
	AppointmentID  uint   `json:"appointment_id"`
	EvaluationName string `json:"evaluation_name"`

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

	// 1. Get GroupProjectID to ensure we clean up scores across ALL appointments for this project
	var appointment entity.Appointment
	if err := db.Preload("GroupProject").First(&appointment, req.AppointmentID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	// CHECK STATUS: Cannot save evaluation if project is completed
	if appointment.GroupProject.GroupStatus == "Completed" {
		tx.Rollback()
		c.JSON(http.StatusForbidden, gin.H{"error": "This project is already graduated/completed. Evaluation cannot be saved."})
		return
	}

	groupProjectID := appointment.GroupProjectID

	// 2. Find IDs of EvaResult to delete (Scoped by Project, Teacher, and EvaluationName)
	var evaResultIDs []uint
	if err := tx.Model(&entity.EvaResult{}).
		Joins("JOIN appointments ON appointments.id = eva_results.appointment_id").
		Joins("JOIN criteria ON criteria.id = eva_results.criteria_id").
		Joins("JOIN evaluations ON evaluations.id = criteria.evaluation_id").
		Where("appointments.group_project_id = ? AND eva_results.teacher_id = ? AND evaluations.name = ?",
			groupProjectID, claims.ID, req.EvaluationName).
		Pluck("eva_results.id", &evaResultIDs).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find old group scores"})
		return
	}

	if len(evaResultIDs) > 0 {
		if err := tx.Delete(&entity.EvaResult{}, evaResultIDs).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear old group scores"})
			return
		}
	}

	// 3. Find IDs of IndividualScore to delete
	var indScoreIDs []uint
	if err := tx.Model(&entity.IndividualScore{}).
		Joins("JOIN appointments ON appointments.id = individual_scores.appointment_id").
		Joins("JOIN criteria ON criteria.id = individual_scores.criteria_id").
		Joins("JOIN evaluations ON evaluations.id = criteria.evaluation_id").
		Where("appointments.group_project_id = ? AND individual_scores.teacher_id = ? AND evaluations.name = ?",
			groupProjectID, claims.ID, req.EvaluationName).
		Pluck("individual_scores.id", &indScoreIDs).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find old individual scores"})
		return
	}

	if len(indScoreIDs) > 0 {
		if err := tx.Delete(&entity.IndividualScore{}, indScoreIDs).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear old individual scores"})
			return
		}
	}

	// บันทึกคะแนนกลุ่ม
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// บันทึกคะแนนรายบุคคล
	for _, item := range req.IndividualScores {
		apptID := req.AppointmentID
		teacherID := claims.ID
		indScore := entity.IndividualScore{
			Score:           item.Score,
			CriteriaID:      item.CriteriaID,
			CriteriaLevelID: item.CriteriaLevelID,
			AppointmentID:   &apptID,
			TeacherID:       &teacherID,
			StudentID:       item.StudentID,
		}
		if err := tx.Create(&indScore).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	tx.Commit()

	log.InsertLog(c, 20)
	c.JSON(http.StatusOK, gin.H{"message": "Evaluation saved successfully"})
}

type PeerEvaluationRequest struct {
	AppointmentID uint `json:"appointment_id"`
	Scores        []struct {
		TargetStudentID uint    `json:"target_student_id"`
		CriteriaID      uint    `json:"criteria_id"`
		CriteriaLevelID *uint   `json:"criteria_level_id"`
		Score           float64 `json:"score"`
	} `json:"scores"`
}

func SavePeerEvaluation(c *gin.Context) {
	var req PeerEvaluationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	evaluatorID := claims.ID

	db := database.DB()
	tx := db.Begin()

	for _, item := range req.Scores {
		if item.TargetStudentID == evaluatorID {
			continue
		}

		var apptIDPtr *uint
		if req.AppointmentID > 0 {
			apptID := req.AppointmentID
			apptIDPtr = &apptID
		}

		var existingScore entity.IndividualScore
		result := tx.Where("student_evaluator_id = ? AND student_id = ? AND criteria_id = ?",
			evaluatorID, item.TargetStudentID, item.CriteriaID).
			Find(&existingScore)

		if result.Error != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}

		if result.RowsAffected > 0 {
			existingScore.Score = item.Score
			existingScore.AppointmentID = apptIDPtr
			if err := tx.Save(&existingScore).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update score"})
				return
			}
		} else {
			newScore := entity.IndividualScore{
				Score:              item.Score,
				CriteriaID:         item.CriteriaID,
				CriteriaLevelID:    item.CriteriaLevelID,
				AppointmentID:      apptIDPtr,
				StudentID:          item.TargetStudentID,
				StudentEvaluatorID: &evaluatorID,
				TeacherID:          nil,
			}
			if err := tx.Create(&newScore).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create score"})
				return
			}
		}
	}

	tx.Commit()
	log.InsertLog(c, 20)
	c.JSON(http.StatusOK, gin.H{"message": "Peer evaluation saved successfully"})
}
