package appointment

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
	"gorm.io/gorm"
)

type AutoScheduleRequest struct {
	StartDateTime     time.Time `json:"start_date_time"`
	EndDateTime       time.Time `json:"end_date_time"`
	DurationMin       int       `json:"duration_min"`
	RoomID            uint      `json:"room_id"`
	AppointmentTypeID uint      `json:"appointment_type_id"`
}

func ListAppointments(c *gin.Context) {
	var appointments []entity.Appointment

	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: " + err.Error()})
		return
	}

	db := database.DB()

	results := db.
		Preload("Room", func(db *gorm.DB) *gorm.DB { return db.Select("id", "name", "location") }).
		Preload("AppointmentType", func(db *gorm.DB) *gorm.DB { return db.Select("id", "name") }).
		Preload("GroupProject", func(db *gorm.DB) *gorm.DB { return db.Select("id", "group_number", "group_status") }).
		Preload("Teacher", func(db *gorm.DB) *gorm.DB { return db.Select("id", "username", "firstname", "lastname") }).
		Preload("Evaluation", func(db *gorm.DB) *gorm.DB { return db.Select("id", "name") }).
		Joins("JOIN users ON users.id = appointments.teacher_id AND users.deleted_at IS NULL").
		Joins("JOIN group_projects ON group_projects.id = appointments.group_project_id AND group_projects.deleted_at IS NULL").
		Joins("LEFT JOIN evaluations ON evaluations.id = appointments.evaluation_id").
		Where("appointments.teacher_id = ?", claims.ID).
		Or("appointments.appointment_type_id = ? AND (group_projects.teacher_id = ? OR (evaluations.name = 'Committee Evaluation' AND users.branch_id = ?))", 3, claims.ID, claims.BranchID).
		Find(&appointments)

	if results.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": results.Error.Error()})
		return
	}

	response := []map[string]interface{}{}

	for _, apt := range appointments {
		item := gin.H{
			"id":                 apt.ID,
			"start_date_time":    apt.StartDateTime,
			"duration_min":       apt.DurationMin,
			"appointment_status": apt.AppointmentStatus,
			"type_id":            apt.AppointmentType.ID,
			"type_name":          apt.AppointmentType.Name,
			"room_id":            apt.Room.ID,
			"room_name":          apt.Room.Name,
			"location":           apt.Room.Location,
			"group_project_id": func() uint {
				if apt.GroupProject != nil {
					return apt.GroupProject.ID
				} else {
					return 0
				}
			}(),
			"group_number": func() uint {
				if apt.GroupProject != nil {
					return apt.GroupProject.GroupNumber
				} else {
					return 0
				}
			}(),
			"teacher_id": func() uint {
				if apt.Teacher != nil {
					return apt.Teacher.ID
				} else {
					return 0
				}
			}(),
			"teacher_name": func() string {
				if apt.Teacher != nil {
					return apt.Teacher.Firstname + " " + apt.Teacher.Lastname
				} else {
					return ""
				}
			}(),
			"evaluation_id": apt.EvaluationID,
			"evaluation_name": func() string {
				if apt.Evaluation != nil {
					return apt.Evaluation.Name
				} else {
					return ""
				}
			}(),
		}
		response = append(response, item)
	}

	c.JSON(http.StatusOK, response)
}

func GetAppointment(c *gin.Context) {
	id := c.Param("id")
	var apt entity.Appointment
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: " + err.Error()})
		return
	}

	db := database.DB()

	err = db.
		Preload("Room", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name", "location")
		}).
		Preload("AppointmentType", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name")
		}).
		Preload("GroupProject", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "group_number", "group_status")
		}).
		Preload("Teacher", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "username", "firstname", "lastname", "phone", "email")
		}).
		Preload("Evaluation", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name")
		}).
		Joins("JOIN users ON users.id = appointments.teacher_id").
		Where("appointments.id = ?", id).
		Where(
			db.Where("appointments.teacher_id = ?", claims.ID).
				Or("appointments.appointment_type_id = ? AND users.branch_id = ?", 3, claims.BranchID),
		).
		First(&apt).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":                 apt.ID,
		"start_date_time":    apt.StartDateTime,
		"duration_min":       apt.DurationMin,
		"appointment_status": apt.AppointmentStatus,

		"type_id":   apt.AppointmentType.ID,
		"type_name": apt.AppointmentType.Name,

		"room_id":   apt.Room.ID,
		"room_name": apt.Room.Name,
		"location":  apt.Room.Location,

		"group_project_id": func() uint {
			if apt.GroupProject != nil {
				return apt.GroupProject.ID
			} else {
				return 0
			}
		}(),
		"group_number": func() uint {
			if apt.GroupProject != nil {
				return apt.GroupProject.GroupNumber
			} else {
				return 0
			}
		}(),
		"group_status": func() string {
			if apt.GroupProject != nil {
				return apt.GroupProject.GroupStatus
			} else {
				return ""
			}
		}(),

		"teacher_id": func() uint {
			if apt.Teacher != nil {
				return apt.Teacher.ID
			} else {
				return 0
			}
		}(),
		"teacher_name": func() string {
			if apt.Teacher != nil {
				return apt.Teacher.Firstname + " " + apt.Teacher.Lastname
			} else {
				return ""
			}
		}(),
		"teacher_email": func() string {
			if apt.Teacher != nil {
				return apt.Teacher.Email
			} else {
				return ""
			}
		}(),
		"teacher_phone": func() string {
			if apt.Teacher != nil {
				return apt.Teacher.Phone
			} else {
				return ""
			}
		}(),
		"evaluation_id": apt.EvaluationID,
		"evaluation_name": func() string {
			if apt.Evaluation != nil {
				return apt.Evaluation.Name
			} else {
				return ""
			}
		}(),
	})
}

func ListRooms(c *gin.Context) {
	var rooms []entity.Room
	db := database.DB()

	if err := db.Select("id", "name", "location", "capacity").Find(&rooms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := []gin.H{}
	for _, room := range rooms {
		response = append(response, gin.H{
			"id":       room.ID,
			"name":     room.Name,
			"location": room.Location,
			"capacity": room.Capacity,
		})
	}

	c.JSON(http.StatusOK, response)
}

func ListAppointmentTypes(c *gin.Context) {
	var types []entity.AppointmentType
	db := database.DB()

	if err := db.Select("id", "name").Find(&types).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := []gin.H{}
	for _, t := range types {
		response = append(response, gin.H{
			"id":   t.ID,
			"name": t.Name,
		})
	}

	c.JSON(http.StatusOK, response)
}

func GetRandomGroup(c *gin.Context) {
	var group entity.GroupProject
	db := database.DB()

	if err := db.Preload("Teacher").
		Where("group_status IN ?", []string{"Pending", "In Process"}).
		Order("RANDOM()").
		First(&group).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{"error": "No pending groups available"})
		return
	}

	advisorName := ""
	if group.Teacher != nil {
		advisorName = group.Teacher.Firstname + " " + group.Teacher.Lastname
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           group.ID,
		"group_number": group.GroupNumber,
		"advisor_id":   group.TeacherID,
		"advisor_name": advisorName,
	})
}

func GetMyProjectAndAppointment(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := database.DB()
	var member entity.GroupMember

	if err := db.Preload("GroupProject").
		Preload("GroupProject.Teacher").
		Preload("GroupProject.TopicSelections.Topic").
		Where("student_id = ?", claims.ID).
		First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "You do not belong to any project group."})
		return
	}

	groupID := member.GroupProjectID
	group := member.GroupProject

	var appointments []entity.Appointment
	if err := db.Preload("Room").Preload("AppointmentType").Preload("Evaluation").
		Where("group_project_id = ? AND appointment_status IN ?", groupID, []string{"scheduled", "completed", "Scheduled", "Completed"}).
		Order("start_date_time ASC").
		Find(&appointments).Error; err != nil {
		// Just ignore error, list will be empty
	}

	projectName := fmt.Sprintf("Group %d", group.GroupNumber)
	if len(group.TopicSelections) > 0 && group.TopicSelections[0].Topic != nil {
		projectName = group.TopicSelections[0].Topic.Title
	}

	apptList := []gin.H{}
	for _, apt := range appointments {
		evaluationName := ""
		if apt.Evaluation != nil {
			evaluationName = apt.Evaluation.Name
		}
		apptList = append(apptList, gin.H{
			"id":              apt.ID,
			"type":            apt.AppointmentType.Name,
			"date_time":       apt.StartDateTime,
			"room":            apt.Room.Name,
			"location":        apt.Room.Location,
			"evaluation_name": evaluationName,
		})
	}

	response := gin.H{
		"group_id":     group.ID,
		"group_number": group.GroupNumber,
		"project_name": projectName,
		"advisor_name": group.Teacher.Firstname + " " + group.Teacher.Lastname,
		"appointments": apptList,
	}

	if len(apptList) > 0 {
		response["appointment"] = apptList[0]
	} else {
		response["appointment"] = nil
	}

	c.JSON(http.StatusOK, response)
}
