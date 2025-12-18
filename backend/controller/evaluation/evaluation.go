package evaluation

import (
	"fmt"
	"net/http"
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
	mode := c.Query("mode")

	db := database.DB()
	var projects []entity.GroupProject
	query := db.Preload("TopicSelections", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at DESC")
	}).Preload("TopicSelections.Topic").
		Preload("Appointment", func(db *gorm.DB) *gorm.DB {
			return db.Order("start_date_time DESC")
		}).
		Preload("Appointment.Evaluation").
		Preload("Appointment.AppointmentType").
		Preload("Appointment.AppointmentType.Evaluation").
		Preload("GroupMembers")

	if mode == "committee" {
		query = query.Joins("JOIN appointments ON appointments.group_project_id = group_projects.id").
			Joins("JOIN users ON users.id = appointments.teacher_id").
			Where("appointments.appointment_type_id = ?", 3).
			Where("users.branch_id = ?", claims.BranchID).
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

		var appointmentID uint
		availableEvaluationsMap := make(map[string]bool)
		var appointmentsList []map[string]interface{}

		for _, apt := range p.Appointment {
			if apt.AppointmentStatus != "scheduled" && apt.AppointmentStatus != "completed" {
				continue
			}

			if mode == "committee" {
				if apt.AppointmentTypeID != 3 {
					continue
				}
				// Allow seeing appointments created by other teachers in the same branch
				// if apt.TeacherID != claims.ID {
				// 	continue
				// }
			}

			if appointmentID == 0 {
				appointmentID = apt.ID
			}

			var evalNames []string
			if apt.EvaluationID != nil && apt.Evaluation != nil {
				evalNames = append(evalNames, apt.Evaluation.Name)
			} else if apt.AppointmentTypeID == 3 {
				isAdvisor := p.TeacherID != nil && *p.TeacherID == claims.ID
				if mode == "committee" {
					evalNames = append(evalNames, "Committee Evaluation")
				} else {
					if isAdvisor {
						evalNames = append(evalNames, "Advisor Evaluation", "Ethics Test")
					}
				}
			} else {
				if apt.AppointmentType != nil {
					for _, e := range apt.AppointmentType.Evaluation {
						evalNames = append(evalNames, e.Name)
					}
				}
			}

			for _, name := range evalNames {
				if name == "Peer Assessment" {
					continue
				}
				if mode == "committee" && name != "Committee Evaluation" {
					continue
				}
				if mode != "committee" && name == "Committee Evaluation" {
					continue
				}
				if !availableEvaluationsMap[name] {
					availableEvaluationsMap[name] = true
				}
				appointmentsList = append(appointmentsList, map[string]interface{}{
					"id":              apt.ID,
					"evaluation_name": name,
				})
			}
		}

		availableEvaluations := []string{}
		for name := range availableEvaluationsMap {
			availableEvaluations = append(availableEvaluations, name)
		}

		totalCount := len(availableEvaluations)
		gradedCount := 0

		if totalCount > 0 {
			var completedEvaluations []string
			db.Model(&entity.EvaResult{}).
				Joins("JOIN criteria ON criteria.id = eva_results.criteria_id").
				Joins("JOIN evaluations ON evaluations.id = criteria.evaluation_id").
				Joins("JOIN appointments ON appointments.id = eva_results.appointment_id").
				Where("appointments.group_project_id = ? AND eva_results.teacher_id = ?", p.ID, claims.ID).
				Distinct("evaluations.name").
				Pluck("evaluations.name", &completedEvaluations)

			for _, completed := range completedEvaluations {
				if availableEvaluationsMap[completed] {
					gradedCount++
				}
			}
		}

		isGraded := (gradedCount == totalCount) && totalCount > 0
		statusText := "Pending"
		if isGraded {
			statusText = "Graded"
		}

		// ถ้าสถานะกลุ่มเป็น Completed ให้ถือว่า Graded แล้ว (กรณีลบนัดหมายไปแล้ว)
		if p.GroupStatus == "Completed" {
			statusText = "Graded"
			isGraded = true
		}

		item := gin.H{
			"id":                    p.ID,
			"group_number":          p.GroupNumber,
			"group_status":          p.GroupStatus,
			"project_name":          projectName,
			"status":                statusText,
			"is_graded":             isGraded,
			"graded_count":          gradedCount,
			"total_count":           totalCount,
			"appointment_id":        appointmentID,
			"students":              p.GroupMembers,
			"available_evaluations": availableEvaluations,
			"appointments":          appointmentsList,
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
	mode := c.Query("mode")
	reqEvalName := strings.TrimSpace(c.Query("evaluation_name"))

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
		criteriaQuery = criteriaQuery.Where("evaluations.appointment_type_id = ?", appointment.AppointmentTypeID)

		if appointment.AppointmentTypeID == 3 {
			if mode == "committee" {
				allowedEvaluations = []string{"Committee Evaluation"}
				if reqEvalName == "" {
					selectedEvaluationName = "Committee Evaluation"
				}
			} else if isAdvisor {
				allowedEvaluations = []string{"Advisor Evaluation", "Ethics Test"}
			} else {
				allowedEvaluations = []string{"Committee Evaluation"}
			}
		}

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

		if cri.Evaluation.ForGroupOnly || cri.IsGroup {
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

	var member entity.GroupMember
	if err := db.Preload("GroupProject").
		Where("student_id = ?", claims.ID).
		First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "You do not belong to any project group."})
		return
	}

	var appointment entity.Appointment
	if err := db.Preload("GroupProject.GroupMembers.Student").
		Preload("AppointmentType").
		Preload("GroupProject.TopicSelections.Topic").
		Preload("Evaluation").
		Joins("LEFT JOIN evaluations ON evaluations.id = appointments.evaluation_id").
		Joins("JOIN appointment_types ON appointment_types.id = appointments.appointment_type_id").
		Where("group_project_id = ? AND appointment_status IN ?", member.GroupProjectID, []string{"scheduled", "completed", "Scheduled", "Completed"}).
		Where("evaluations.name = ?", "Peer Assessment").
		Order("start_date_time DESC").
		First(&appointment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active Peer Assessment appointment found"})
		return
	}

	var formCriteria []entity.Criteria

	if err := db.
		Preload("CriteriaLevel").
		Preload("Evaluation").
		Joins("JOIN evaluations ON evaluations.id = criteria.evaluation_id").
		Where("evaluations.id = ?", *appointment.EvaluationID).
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

		if cri.Evaluation.ForGroupOnly || cri.IsGroup {
			groupCriteria = append(groupCriteria, data)
		} else {
			individualCriteria = append(individualCriteria, data)
		}
	}

	students := []gin.H{}
	for _, member := range appointment.GroupProject.GroupMembers {
		if member.Student != nil {
			if member.Student.ID == claims.ID {
				continue
			}

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
