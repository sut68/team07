package topic

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/database"
)

// POST /topics
func CreateTopic(c *gin.Context) {
	var topic entity.Topic

	topic.Title = c.PostForm("title")
	topic.Objective = c.PostForm("objective")
	topic.Scope = c.PostForm("scope")
	topic.Description = c.PostForm("description")
	topic.ProposerRole = c.PostForm("proposer_role")

	if teacherIDStr := c.PostForm("teacher_id"); teacherIDStr != "" {
		if id, err := strconv.ParseUint(teacherIDStr, 10, 32); err == nil {
			uid := uint(id)
			topic.TeacherID = &uid
		}
	}

	if groupIDStr := c.PostForm("group_project_id"); groupIDStr != "" {
		if id, err := strconv.ParseUint(groupIDStr, 10, 32); err == nil {
			uid := uint(id)
			topic.GroupProjectID = &uid
		}
	}

	// ===== Set Status ตาม proposer_role =====
	switch topic.ProposerRole {
	case "Teacher":
		topic.Status = "Approved"

	case "Student":
		topic.Status = "Pending"

		// Fetch TeacherID from GroupProject
		if topic.GroupProjectID != nil {
			var groupProject entity.GroupProject
			db := database.DB()
			if err := db.First(&groupProject, topic.GroupProjectID).Error; err == nil {
				if groupProject.TeacherID != nil {
					topic.TeacherID = groupProject.TeacherID
				}
			}
		}

	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid proposer_role",
		})
		return
	}

	// ===== Handle File Upload (Multiple) =====
	form, err := c.MultipartForm()
	if err == nil {
		files := form.File["file_attachment"]
		var fileList []string

		uploadPath := "uploads/topics"
		if _, err := os.Stat(uploadPath); os.IsNotExist(err) {
			os.MkdirAll(uploadPath, 0755)
		}

		for _, file := range files {
			filename := fmt.Sprintf(
				"%d_%s",
				time.Now().UnixNano(),
				filepath.Base(file.Filename),
			)
			filePath := filepath.Join(uploadPath, filename)

			if err := c.SaveUploadedFile(file, filePath); err != nil {
				continue // Or handle error, but trying to save as many as possible
			}
			fileList = append(fileList, filename)
		}

		if len(fileList) > 0 {
			// Marshal to JSON
			jsonBytes, err := json.Marshal(fileList)
			if err == nil {
				topic.FileAttachment = string(jsonBytes)
			}
		}
	}

	db := database.DB()
	if err := db.Create(&topic).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": topic})
}


// GET /topics/:id
func GetTopic(c *gin.Context) {
	var topic entity.Topic
	id := c.Param("id")

	db := database.DB()
	if err := db.Preload("GroupProject").Preload("TopicApproval").First(&topic, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Topic not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": topic})
}

// GET /topics
func ListTopics(c *gin.Context) {
	var topics []entity.Topic

	// Query Parameters for filtering
	proposerRole := c.Query("proposer_role")
	groupID := c.Query("group_id")
	teacherID := c.Query("teacher_id")
	filter := c.Query("filter")

	db := database.DB()
	query := db.Preload("GroupProject").Preload("TopicApproval")

	if proposerRole != "" {
		query = query.Where("proposer_role = ?", proposerRole)
	}
	if groupID != "" {
		query = query.Where("group_project_id = ?", groupID)
	}

	if teacherID != "" {
		if filter == "my_topics" {
			query = query.Where("teacher_id = ?", teacherID)
		} else if filter == "advisor" {
			query = query.Joins("JOIN group_projects ON group_projects.id = topics.group_project_id").
				Where("group_projects.teacher_id = ?", teacherID)
		}
	}

	if err := query.Find(&topics).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": topics})
}

// DELETE /topics/:id
func DeleteTopic(c *gin.Context) {
	id := c.Param("id")
	db := database.DB()

	if err := db.Delete(&entity.Topic{}, id).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": id})
}

// PATCH /topics/:id
func UpdateTopic(c *gin.Context) {
	var topic entity.Topic
	var payload entity.Topic

	id := c.Param("id")
	db := database.DB()

	if err := db.First(&topic, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Topic not found"})
		return
	}

	// Bind form data
	payload.Title = c.PostForm("title")
	payload.Objective = c.PostForm("objective")
	payload.Scope = c.PostForm("scope")
	payload.Description = c.PostForm("description")
	payload.Status = c.PostForm("status")
	
	// Handle File Upload (Multiple)
	form, err := c.MultipartForm()
	
	// Collect files: existing + new
	var finalFileList []string

	// 1. Get Existing Files
	existingFiles := c.PostFormArray("existing_files")
	if len(existingFiles) > 0 {
		finalFileList = append(finalFileList, existingFiles...)
	}

	// 2. Handle New Files
	if err == nil {
		files := form.File["file_attachment"]
		uploadPath := "uploads/topics"
		if len(files) > 0 {
			if _, err := os.Stat(uploadPath); os.IsNotExist(err) {
				os.MkdirAll(uploadPath, 0755)
			}

			for _, file := range files {
				filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), file.Filename)
				filePath := filepath.Join(uploadPath, filename)
				if err := c.SaveUploadedFile(file, filePath); err == nil {
					finalFileList = append(finalFileList, filename)
				}
			}
		}
	}
	
	if len(finalFileList) > 0 {
		jsonBytes, _ := json.Marshal(finalFileList)
		payload.FileAttachment = string(jsonBytes)
	} else if c.Request.MultipartForm != nil {
		payload.FileAttachment = topic.FileAttachment
	} else {
         payload.FileAttachment = topic.FileAttachment
    }

	// Update fields
	// Update fields only if they are not empty in payload
	if payload.Title != "" {
		topic.Title = payload.Title
	}
	if payload.Objective != "" {
		topic.Objective = payload.Objective
	}
	if payload.Scope != "" {
		topic.Scope = payload.Scope
	}
	if payload.Description != "" {
		topic.Description = payload.Description
	}
	
	// Only update status if provided
	if payload.Status != "" {
		topic.Status = payload.Status
	}

	topic.FileAttachment = payload.FileAttachment

	if err := db.Save(&topic).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": topic})
}


// PATCH /topics/:id/approval
// Used for Approving or Rejecting a topic
func ApproveTopic(c *gin.Context) {
	var topic entity.Topic
	var approval entity.TopicApproval

	id := c.Param("id")
	db := database.DB()

	if err := db.First(&topic, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Topic not found"})
		return
	}

	if err := c.ShouldBindJSON(&approval); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validations
	if approval.Status != "Approved" && approval.Status != "Rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	// Update Topic Status
	topic.Status = approval.Status
	if err := db.Save(&topic).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create Approval Record
	approval.TopicID = topic.ID
	approval.ApprovalDate = time.Now()

	if approval.TeacherID == 0 {

	}

	if err := db.Create(&approval).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": topic, "approval": approval})
}

// POST /topics/:id/select
func SelectTopic(c *gin.Context) {
	var payload struct {
		GroupProjectID uint `json:"group_project_id"`
	}
	topicID := c.Param("id")

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.DB()

	// 1. Check if group already has an active selection
	var existingSelection entity.TopicSelection
	if err := db.Where("group_project_id = ? AND status != ?", payload.GroupProjectID, "Cancelled").First(&existingSelection).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Group already has an active topic selection"})
		return
	}

	// 2. Check if group has an active student proposal
	var existingTopic entity.Topic
	if err := db.Where("group_project_id = ? AND proposer_role = ? AND status != ?", payload.GroupProjectID, "Student", "Closed").First(&existingTopic).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Group already has an active topic proposal"})
		return
	}

	// 3. Create Selection
	tid, _ := strconv.ParseUint(topicID, 10, 32)

	// 2.5 Check if the topic is already selected by another group
	var duplicateSelection entity.TopicSelection

	err := db.Where(
		"topic_id = ? AND status = ? AND group_project_id != ?",
		tid,
		"Active",
		payload.GroupProjectID,
	).First(&duplicateSelection).Error

	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "This topic has already been selected by another group",
    })
    return
}


	selection := entity.TopicSelection{
		TopicID:        uint(tid),
		GroupProjectID: payload.GroupProjectID,
		Status:         "Active", // Teacher topics are auto-approved
		DateSelected:   time.Now(),
	}

	if err := db.Create(&selection).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": selection})
}

// POST /topics/cancel-selection
func CancelSelection(c *gin.Context) {
	var payload struct {
		GroupProjectID uint `json:"group_project_id"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.DB()

	// 1. หา selection ที่ยัง active
	var selection entity.TopicSelection
	if err := db.
		Where("group_project_id = ? AND status = ?", payload.GroupProjectID, "Active").
		First(&selection).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{"error": "No active selection found"})
		return
	}

	// 2. ปิด selection เสมอ
	selection.Status = "Cancelled"
	if err := db.Save(&selection).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 3. หา topic ที่ถูกเลือก
	var topic entity.Topic
	if err := db.First(&topic, selection.TopicID).Error; err == nil {

		// 4. ถ้าเป็น Student Topic → ปิดหัวข้อถาวร
		if topic.ProposerRole == "Student" {
			topic.Status = "Closed"
			db.Save(&topic)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Selection cancelled successfully",
	})
}


// GET /student/topic
func GetStudentTopic(c *gin.Context) {
	groupID := c.Query("group_id")
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group_id is required"})
		return
	}

	db := database.DB()

	// 1. Check for Selection (Active only)
	var selection entity.TopicSelection
	if err := db.Preload("Topic").Where("group_project_id = ? AND status = ?", groupID, "Active").First(&selection).Error; err == nil {
			c.JSON(http.StatusOK, gin.H{"data": selection.Topic, "source": "selection"})
			return
	}

	// 2. Check for Student Proposal
	var topic entity.Topic
	if err := db.Where("group_project_id = ? AND proposer_role = ? AND status != ?", groupID, "Student", "Closed").First(&topic).Error; err == nil {
			c.JSON(http.StatusOK, gin.H{"data": topic, "source": "proposal"})
			return
	}

	c.JSON(http.StatusOK, gin.H{"data": nil})
}

