package evaluation

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

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
	mode := c.Query("mode")

	var filterTypeID int
	if typeIDStr != "" {
		filterTypeID, _ = strconv.Atoi(typeIDStr)
	}

	db := database.DB()
	var projects []entity.GroupProject
	query := db.Preload("TopicSelections", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at DESC")
	}).Preload("TopicSelections.Topic").
		Preload("Appointment", func(db *gorm.DB) *gorm.DB {
			return db.Order("start_date_time DESC")
		}).
		Preload("GroupMembers") // Preload members to fix count issue

	if mode == "committee" {
		query = query.Joins("JOIN appointments ON appointments.group_project_id = group_projects.id").
			Where("appointments.appointment_type_id = ?", 3).
			Group("group_projects.id")
	} else {
		query = query.Where("teacher_id = ?", claims.ID)
	}

	if err := query.Find(&projects).Error; err != nil {
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

		var appointmentID uint
		for _, apt := range p.Appointment {
			if apt.AppointmentStatus == "scheduled" || apt.AppointmentStatus == "completed" {
				if mode == "committee" {
					if apt.AppointmentTypeID == 3 {
						appointmentID = apt.ID
						break
					}
				} else {
					appointmentID = apt.ID
					break
				}
			}
		}

		item := gin.H{
			"id":             p.ID,
			"group_number":   p.GroupNumber,
			"project_name":   projectName,
			"status":         statusText,
			"is_graded":      isGraded,
			"appointment_id": appointmentID,
			"students":       p.GroupMembers,
		}
		response = append(response, item)
	}

	c.JSON(http.StatusOK, response)
}

func GetEvaluationForm(c *gin.Context) {
	appointmentID := c.Param("appointment_id")

	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := database.DB()
	var appointment entity.Appointment

	if err := db.Preload("GroupProject.GroupMembers.Student").
		Preload("AppointmentType").
		Preload("GroupProject.TopicSelections.Topic").
		First(&appointment, appointmentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	if appointment.AppointmentTypeID != 3 {
		if appointment.GroupProject.TeacherID == nil || *appointment.GroupProject.TeacherID != claims.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Only advisor can evaluate this section."})
			return
		}
	}

	isAdvisor := appointment.GroupProject.TeacherID != nil && *appointment.GroupProject.TeacherID == claims.ID

	var formCriteria []entity.Criteria
	allowedEvaluations := []string{}
	selectedEvaluationName := ""

	criteriaQuery := db.
		Preload("CriteriaLevel").
		Preload("Evaluation").
		Joins("JOIN evaluations ON evaluations.id = criteria.evaluation_id").
		Order("criteria.order ASC")

	if appointment.EvaluationID != nil {
		criteriaQuery = criteriaQuery.Where("evaluations.id = ?", *appointment.EvaluationID)
		var evaluation entity.Evaluation
		if err := db.First(&evaluation, *appointment.EvaluationID).Error; err == nil {
			allowedEvaluations = []string{evaluation.Name}
			selectedEvaluationName = evaluation.Name
		}
	} else {
		// Fallback Logic
		criteriaQuery = criteriaQuery.Where("evaluations.appointment_type_id = ?", appointment.AppointmentTypeID)

		if appointment.AppointmentTypeID == 3 {
			if isAdvisor {
				allowedEvaluations = []string{"Advisor Evaluation", "Ethics Test"}
			} else {
				allowedEvaluations = []string{"Committee Evaluation"}
			}
		}

		reqEvalName := strings.TrimSpace(c.Query("evaluation_name"))
		if reqEvalName != "" {
			if len(allowedEvaluations) > 0 {
				allowed := false
				for _, name := range allowedEvaluations {
					if name == reqEvalName {
						allowed = true
						break
					}
				}
				if !allowed {
					c.JSON(http.StatusForbidden, gin.H{"error": "Evaluation not allowed for this appointment"})
					return
				}
			}
			selectedEvaluationName = reqEvalName
		}

		if selectedEvaluationName == "" && len(allowedEvaluations) > 0 {
			selectedEvaluationName = allowedEvaluations[0]
		}

		if selectedEvaluationName != "" {
			criteriaQuery = criteriaQuery.Where("evaluations.name = ?", selectedEvaluationName)
		}
	}

	if err := criteriaQuery.Find(&formCriteria).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Criteria not found"})
		return
	}

	if selectedEvaluationName == "" && len(formCriteria) > 0 && formCriteria[0].Evaluation != nil {
		selectedEvaluationName = formCriteria[0].Evaluation.Name
	}

	availableEvaluations := []string{}
	if len(allowedEvaluations) > 0 {
		var evalNames []string
		if err := db.Model(&entity.Evaluation{}).
			Where("appointment_type_id = ?", appointment.AppointmentTypeID).
			Pluck("name", &evalNames).Error; err == nil {
			for _, allowedName := range allowedEvaluations {
				for _, existing := range evalNames {
					if allowedName == existing {
						availableEvaluations = append(availableEvaluations, allowedName)
						break
					}
				}
			}
		}
	}

	if len(availableEvaluations) == 0 && selectedEvaluationName != "" {
		availableEvaluations = append(availableEvaluations, selectedEvaluationName)
	}

	groupCriteria := []gin.H{}
	individualCriteria := []gin.H{}

	for _, cri := range formCriteria {
		levels := []gin.H{}
		for _, lvl := range cri.CriteriaLevel {
			levels = append(levels, gin.H{
				"id":          lvl.ID,
				"description": lvl.Description,
				"score":       lvl.Score,
			})
		}

		data := gin.H{
			"id":        cri.ID,
			"name":      cri.Name,
			"max_score": cri.MaxScore,
			"levels":    levels,
		}

		if cri.Evaluation.ForGroupOnly {
			groupCriteria = append(groupCriteria, data)
		} else {
			individualCriteria = append(individualCriteria, data)
		}
	}

	students := []gin.H{}
	for _, member := range appointment.GroupProject.GroupMembers {
		if member.Student != nil {
			rawCode := strings.Split(member.Student.Username, "@")[0]
			displayCode := strings.ToUpper(rawCode)
			students = append(students, gin.H{
				"student_id": member.Student.ID,
				"code":       displayCode,
				"name":       member.Student.Firstname + " " + member.Student.Lastname,
			})
		}
	}

	projectName := fmt.Sprintf("Group %d", appointment.GroupProject.GroupNumber)
	if len(appointment.GroupProject.TopicSelections) > 0 {
		if appointment.GroupProject.TopicSelections[0].Topic != nil {
			projectName = appointment.GroupProject.TopicSelections[0].Topic.Title
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"appointment_id":        appointment.ID,
		"project_id":            appointment.GroupProjectID,
		"project_name":          projectName,
		"eval_type":             appointment.AppointmentType.Name,
		"current_evaluation":    selectedEvaluationName,
		"available_evaluations": availableEvaluations,
		"group_criteria":        groupCriteria,
		"individual_criteria":   individualCriteria,
		"students":              students,
	})
}

func GetStudentEvaluationForm(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := database.DB()

	// Find student's group
	var member entity.GroupMember
	if err := db.Preload("GroupProject").
		Where("student_id = ?", claims.ID).
		First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "You do not belong to any project group."})
		return
	}

	// Find active appointment
	var appointment entity.Appointment
	if err := db.Preload("GroupProject.GroupMembers.Student").
		Preload("AppointmentType").
		Preload("GroupProject.TopicSelections.Topic").
		Where("group_project_id = ? AND appointment_status IN ?", member.GroupProjectID, []string{"scheduled", "completed"}).
		Order("start_date_time DESC").
		First(&appointment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active appointment found"})
		return
	}

	var formCriteria []entity.Criteria

	if err := db.
		Preload("CriteriaLevel").
		Preload("Evaluation").
		Joins("JOIN evaluations ON evaluations.id = criteria.evaluation_id").
		Where("evaluations.appointment_type_id = ?", appointment.AppointmentTypeID).
		Order("criteria.order ASC").
		Find(&formCriteria).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Criteria not found"})
		return
	}

	groupCriteria := []gin.H{}
	individualCriteria := []gin.H{}

	for _, cri := range formCriteria {
		levels := []gin.H{}
		for _, lvl := range cri.CriteriaLevel {
			levels = append(levels, gin.H{
				"id":          lvl.ID,
				"description": lvl.Description,
				"score":       lvl.Score,
			})
		}

		data := gin.H{
			"id":        cri.ID,
			"name":      cri.Name,
			"max_score": cri.MaxScore,
			"levels":    levels,
		}

		if cri.Evaluation.ForGroupOnly {
			groupCriteria = append(groupCriteria, data)
		} else {
			individualCriteria = append(individualCriteria, data)
		}
	}

	students := []gin.H{}
	for _, member := range appointment.GroupProject.GroupMembers {
		if member.Student != nil {

			rawCode := strings.Split(member.Student.Username, "@")[0]
			displayCode := strings.ToUpper(rawCode)
			students = append(students, gin.H{
				"id":         member.Student.ID,
				"student_id": member.Student.ID,
				"code":       displayCode,
				"firstname":  member.Student.Firstname,
				"lastname":   member.Student.Lastname,
				"name":       member.Student.Firstname + " " + member.Student.Lastname,
			})
		}
	}

	projectName := fmt.Sprintf("Group %d", appointment.GroupProject.GroupNumber)
	if len(appointment.GroupProject.TopicSelections) > 0 {
		if appointment.GroupProject.TopicSelections[0].Topic != nil {
			projectName = appointment.GroupProject.TopicSelections[0].Topic.Title
		}
	}

	// Fetch existing peer evaluation scores
	var existingScores []entity.IndividualScore
	db.Where("appointment_id = ? AND student_evaluator_id = ?", appointment.ID, claims.ID).
		Find(&existingScores)

	scoresMap := make(map[uint]float64)
	for _, s := range existingScores {
		scoresMap[s.StudentID] = s.Score
	}

	c.JSON(http.StatusOK, gin.H{
		"appointment": gin.H{
			"id": appointment.ID,
		},
		"appointment_id":      appointment.ID,
		"project_id":          appointment.GroupProjectID,
		"project_name":        projectName,
		"eval_type":           appointment.AppointmentType.Name,
		"group_criteria":      groupCriteria,
		"individual_criteria": individualCriteria,
		"students":            students,
		"existing_scores":     scoresMap,
	})
}

func GetEvaluationResult(c *gin.Context) {
	appointmentID := c.Param("appointment_id")

	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := database.DB()

	var groupResults []entity.EvaResult
	if err := db.Where("appointment_id = ? AND teacher_id = ?", appointmentID, claims.ID).
		Find(&groupResults).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch group scores"})
		return
	}

	groupScores := []gin.H{}
	for _, res := range groupResults {
		groupScores = append(groupScores, gin.H{
			"criteria_id":       res.CriteriaID,
			"criteria_level_id": res.CriteriaLevelID,
			"score":             res.Score,
			"comment":           res.Comment,
		})
	}

	var individualResults []entity.IndividualScore
	if err := db.Where("appointment_id = ? AND teacher_id = ?", appointmentID, claims.ID).
		Find(&individualResults).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch individual scores"})
		return
	}

	individualScores := []gin.H{}
	for _, res := range individualResults {
		individualScores = append(individualScores, gin.H{
			"student_id":        res.StudentID,
			"criteria_id":       res.CriteriaID,
			"criteria_level_id": res.CriteriaLevelID,
			"score":             res.Score,
		})
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

	studentScores := make(map[uint]map[string][]float64)
	studentDetails := make(map[uint]string)

	for _, res := range indResults {
		sID := res.StudentID
		evalName := res.Criteria.Evaluation.Name

		if studentScores[sID] == nil {
			studentScores[sID] = make(map[string][]float64)
			if res.Student != nil {
				rawCode := strings.Split(res.Student.Username, "@")[0]
				studentDetails[sID] = strings.ToUpper(rawCode) + " " + res.Student.Firstname
			}
		}
		studentScores[sID][evalName] = append(studentScores[sID][evalName], res.Score)
	}

	individualSummary := []gin.H{}
	for sID, evals := range studentScores {
		evalList := []gin.H{}
		var myTotalIndScore float64 = 0

		for evalName, scores := range evals {
			sum := 0.0
			for _, s := range scores {
				sum += s
			}
			avg := 0.0
			if len(scores) > 0 {
				avg = sum / float64(len(scores))
			}

			myTotalIndScore += avg

			evalList = append(evalList, gin.H{
				"evaluation_name": evalName,
				"average_score":   fmt.Sprintf("%.2f", avg),
				"count":           len(scores),
			})
		}

		individualSummary = append(individualSummary, gin.H{
			"student_id":       sID,
			"student_name":     studentDetails[sID],
			"scores":           evalList,
			"total_individual": fmt.Sprintf("%.2f", myTotalIndScore),
			"grand_total":      fmt.Sprintf("%.2f", totalGroupScore+myTotalIndScore),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"project_id":         projectID,
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
	var indScores []entity.IndividualScore
	if err := db.Where("student_id = ?", studentID).Find(&indScores).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch scores"})
		return
	}

	var totalScore float64 = 0
	count := 0
	for _, s := range indScores {
		totalScore += s.Score
		count++
	}

	c.JSON(http.StatusOK, gin.H{
		"total_score":   totalScore,
		"average_score": totalScore / float64(count),
		"status":        "completed",
	})
}
