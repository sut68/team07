package evaluation

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
)

func GetEvaluationResult(c *gin.Context) {
	appointmentID := c.Param("appointment_id")

	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := database.DB()

	// 1. Get Current Appointment to find GroupProjectID
	var currentAppt entity.Appointment
	if err := db.Select("group_project_id").First(&currentAppt, appointmentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	// 2. Fetch Group Scores (EvaResult)
	// Find results for this project and teacher, ordered by latest first
	var groupResults []entity.EvaResult
	if err := db.Unscoped().
		Joins("JOIN appointments ON appointments.id = eva_results.appointment_id").
		Where("appointments.group_project_id = ? AND eva_results.teacher_id = ?", currentAppt.GroupProjectID, claims.ID).
		Order("eva_results.created_at DESC").
		Find(&groupResults).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch group scores"})
		return
	}

	groupScores := []gin.H{}
	seenCriteria := make(map[uint]bool)
	for _, res := range groupResults {
		if !seenCriteria[res.CriteriaID] {
			groupScores = append(groupScores, gin.H{
				"criteria_id":       res.CriteriaID,
				"criteria_level_id": res.CriteriaLevelID,
				"score":             res.Score,
				"comment":           res.Comment,
			})
			seenCriteria[res.CriteriaID] = true
		}
	}

	var individualResults []entity.IndividualScore
	if err := db.Unscoped().
		Joins("JOIN appointments ON appointments.id = individual_scores.appointment_id").
		Where("appointments.group_project_id = ? AND individual_scores.teacher_id = ?", currentAppt.GroupProjectID, claims.ID).
		Order("individual_scores.created_at DESC").
		Find(&individualResults).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch individual scores"})
		return
	}

	individualScores := []gin.H{}
	seenIndividual := make(map[string]bool)
	for _, res := range individualResults {
		key := fmt.Sprintf("%d_%d", res.StudentID, res.CriteriaID)
		if !seenIndividual[key] {
			individualScores = append(individualScores, gin.H{
				"student_id":        res.StudentID,
				"criteria_id":       res.CriteriaID,
				"criteria_level_id": res.CriteriaLevelID,
				"score":             res.Score,
			})
			seenIndividual[key] = true
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"group_scores":      groupScores,
		"individual_scores": individualScores,
	})
}

func GetEvaluationSummary(c *gin.Context) {
	projectID := c.Param("group_project_id")

	_, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := database.DB()

	var groupResults []entity.EvaResult
	if err := db.Preload("Criteria.Evaluation").
		Joins("JOIN appointments ON appointments.id = eva_results.appointment_id").
		Where("appointments.group_project_id = ?", projectID).
		Find(&groupResults).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch group results"})
		return
	}

	groupScoresMap := make(map[string]map[uint]float64)
	maxScoreMap := make(map[string]float64)

	for _, res := range groupResults {
		evalName := res.Criteria.Evaluation.Name
		teacherID := res.TeacherID

		if groupScoresMap[evalName] == nil {
			groupScoresMap[evalName] = make(map[uint]float64)
			maxScoreMap[evalName] = res.Criteria.Evaluation.TotalScore
		}
		groupScoresMap[evalName][teacherID] += res.Score
	}

	groupSummary := []gin.H{}
	var totalGroupScore float64 = 0

	for evalName, teachersScores := range groupScoresMap {
		var sumScore float64 = 0
		teacherCount := 0
		for _, score := range teachersScores {
			sumScore += score
			teacherCount++
		}
		averageScore := 0.0
		if teacherCount > 0 {
			averageScore = sumScore / float64(teacherCount)
		}
		totalGroupScore += averageScore

		groupSummary = append(groupSummary, gin.H{
			"evaluation_name": evalName,
			"teacher_count":   teacherCount,
			"average_score":   fmt.Sprintf("%.2f", averageScore),
			"full_score":      maxScoreMap[evalName],
		})
	}

	var indResults []entity.IndividualScore
	if err := db.Preload("Criteria.Evaluation").
		Preload("Student").
		Joins("JOIN appointments ON appointments.id = individual_scores.appointment_id").
		Where("appointments.group_project_id = ?", projectID).
		Find(&indResults).Error; err != nil {
	}

	studentScores := make(map[uint]map[string]map[uint]float64)
	studentDetails := make(map[uint]string)

	for _, res := range indResults {
		sID := res.StudentID
		evalName := res.Criteria.Evaluation.Name
		teacherID := uint(0)
		if res.TeacherID != nil {
			teacherID = *res.TeacherID
		}

		if studentScores[sID] == nil {
			studentScores[sID] = make(map[string]map[uint]float64)
			if res.Student != nil {
				rawCode := strings.Split(res.Student.Username, "@")[0]
				studentDetails[sID] = strings.ToUpper(rawCode) + " " + res.Student.Firstname
			}
		}
		if studentScores[sID][evalName] == nil {
			studentScores[sID][evalName] = make(map[uint]float64)
		}
		studentScores[sID][evalName][teacherID] += res.Score
	}

	individualSummary := []gin.H{}
	for sID, evals := range studentScores {
		evalList := []gin.H{}
		var myTotalIndScore float64 = 0

		for evalName, teacherScores := range evals {
			sumTeacherAvg := 0.0
			teacherCount := 0

			for _, score := range teacherScores {
				sumTeacherAvg += score
				teacherCount++
			}

			avg := 0.0
			if teacherCount > 0 {
				avg = sumTeacherAvg / float64(teacherCount)
			}

			myTotalIndScore += avg

			evalList = append(evalList, gin.H{
				"evaluation_name": evalName,
				"average_score":   fmt.Sprintf("%.2f", avg),
				"count":           teacherCount,
			})
		}

		grandTotal := totalGroupScore + myTotalIndScore
		grade := CalculateGrade(grandTotal)

		individualSummary = append(individualSummary, gin.H{
			"student_id":       sID,
			"student_name":     studentDetails[sID],
			"scores":           evalList,
			"total_individual": fmt.Sprintf("%.2f", myTotalIndScore),
			"grand_total":      fmt.Sprintf("%.2f", grandTotal),
			"grade":            grade,
		})
	}

	var groupProject entity.GroupProject
	if err := db.First(&groupProject, projectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"project_id":         projectID,
		"group_status":       groupProject.GroupStatus,
		"group_total_score":  fmt.Sprintf("%.2f", totalGroupScore),
		"group_details":      groupSummary,
		"individual_details": individualSummary,
	})
}

func GetStudentEvaluationResult(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	studentID := claims.ID

	db := database.DB()
	var member entity.GroupMember
	if err := db.Where("student_id = ?", studentID).First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not in a group"})
		return
	}
	projectID := member.GroupProjectID

	var groupResults []entity.EvaResult
	if err := db.Preload("Criteria.Evaluation").
		Preload("Teacher").
		Joins("JOIN appointments ON appointments.id = eva_results.appointment_id").
		Where("appointments.group_project_id = ?", projectID).
		Find(&groupResults).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch group results"})
		return
	}

	groupScoresMap := make(map[string]map[uint]float64)
	var comments []gin.H

	for _, res := range groupResults {
		evalName := res.Criteria.Evaluation.Name
		teacherID := res.TeacherID

		if groupScoresMap[evalName] == nil {
			groupScoresMap[evalName] = make(map[uint]float64)
		}
		groupScoresMap[evalName][teacherID] += res.Score

		if res.Comment != "" {
			comments = append(comments, gin.H{
				"evaluation_name": evalName,
				"teacher_name":    fmt.Sprintf("%s %s", res.Teacher.Firstname, res.Teacher.Lastname),
				"criteria":        res.Criteria.Name,
				"comment":         res.Comment,
			})
		}
	}

	var totalGroupScore float64 = 0
	groupDetails := []gin.H{}

	for evalName, teachersScores := range groupScoresMap {
		var sumScore float64 = 0
		teacherCount := 0
		for _, score := range teachersScores {
			sumScore += score
			teacherCount++
		}
		averageScore := 0.0
		if teacherCount > 0 {
			averageScore = sumScore / float64(teacherCount)
		}
		totalGroupScore += averageScore

		groupDetails = append(groupDetails, gin.H{
			"evaluation_name": evalName,
			"score":           fmt.Sprintf("%.2f", averageScore),
		})
	}

	var indResults []entity.IndividualScore
	if err := db.Preload("Criteria.Evaluation").
		Where("student_id = ?", studentID).
		Find(&indResults).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch individual scores"})
		return
	}

	// evalName -> teacherID -> scoreSum
	studentScores := make(map[string]map[uint]float64)
	for _, res := range indResults {
		evalName := res.Criteria.Evaluation.Name
		teacherID := uint(0)
		if res.TeacherID != nil {
			teacherID = *res.TeacherID
		}

		if studentScores[evalName] == nil {
			studentScores[evalName] = make(map[uint]float64)
		}
		studentScores[evalName][teacherID] += res.Score
	}

	var myTotalIndScore float64 = 0
	individualDetails := []gin.H{}

	for evalName, teacherScores := range studentScores {
		sumTeacherAvg := 0.0
		teacherCount := 0

		for _, score := range teacherScores {
			sumTeacherAvg += score
			teacherCount++
		}

		avg := 0.0
		if teacherCount > 0 {
			avg = sumTeacherAvg / float64(teacherCount)
		}
		myTotalIndScore += avg

		individualDetails = append(individualDetails, gin.H{
			"evaluation_name": evalName,
			"score":           fmt.Sprintf("%.2f", avg),
		})
	}

	grandTotal := totalGroupScore + myTotalIndScore
	grade := CalculateGrade(grandTotal)

	c.JSON(http.StatusOK, gin.H{
		"total_score":        fmt.Sprintf("%.2f", grandTotal),
		"average_score":      fmt.Sprintf("%.2f", grandTotal),
		"grade":              grade,
		"status":             "completed",
		"group_details":      groupDetails,
		"individual_details": individualDetails,
		"comments":           comments,
	})
}

func CalculateGrade(score float64) string {
	if score >= 80 {
		return "A"
	} else if score >= 75 {
		return "B+"
	} else if score >= 70 {
		return "B"
	} else if score >= 65 {
		return "C+"
	} else if score >= 60 {
		return "C"
	} else if score >= 55 {
		return "D+"
	} else if score >= 50 {
		return "D"
	} else {
		return "F"
	}
}
