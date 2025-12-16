package topic

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/database"
)

// POST /topics
func CreateTopic(c *gin.Context) {
	var topic entity.Topic

	// Bind form data
	if err := c.ShouldBind(&topic); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If the topic is created by a Teacher, automatically set status to "Approved"
	if topic.ProposerRole == "Teacher" {
		topic.Status = "Open"
	} else if topic.ProposerRole == "Student" {
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
	}

	// Handle File Upload
	file, err := c.FormFile("file_attachment")
	if err == nil {
		uploadPath := "uploads/topics" 
		if _, err := os.Stat(uploadPath); os.IsNotExist(err) {
			os.MkdirAll(uploadPath, 0755)
		}

		filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), file.Filename)
		filePath := filepath.Join(uploadPath, filename)

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}
		topic.FileAttachment = filename
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
	if err := c.ShouldBind(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Handle File Upload (Optional update)
	file, err := c.FormFile("file_attachment")
	if err == nil {
		uploadPath := "uploads/topics"
		if _, err := os.Stat(uploadPath); os.IsNotExist(err) {
			os.MkdirAll(uploadPath, 0755)
		}
		filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), file.Filename)
		filePath := filepath.Join(uploadPath, filename)
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}
		payload.FileAttachment = filename
	} else {
		// Keep existing file if not provided
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

	// Update FileAttachment only if a new file was uploaded (filename would be set in payload.FileAttachment)
	// If no new file, we already set payload.FileAttachment to topic.FileAttachment, 
	// but to be safe with partial updates logic:
	// If payload.FileAttachment was derived from c.FormFile, it will be the new filename.
	// If it was fallback to topic.FileAttachment, it's same.
	// So assignment is safe IF lines 150-159 logic is preserved correctly?
	// Lines 150-159 sets payload.FileAttachment based on upload.
	// But if we just want to update status, and no file sent?
	// c.FormFile returns error. else block runs: payload.FileAttachment = topic.FileAttachment.
	// So payload.FileAttachment IS correct.
	topic.FileAttachment = payload.FileAttachment
	
	// If approval logic is needed here (e.g. changing status to Rejected/Approved), 
	// it should probably be handled in a separate specific endpoint or carefully here.
	// For now, we allow updating everything.

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
	
	// IMPORTANT: TeacherID should come from Context (JWT Middleware), mocking for now or expecting in payload
	// In production, get from c.MustGet("userId")
	if approval.TeacherID == 0 {
		// Fallback for testing/dev if not sent
		// c.JSON(http.StatusBadRequest, gin.H{"error": "TeacherID is required"})
		// return
	}

	if err := db.Create(&approval).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": topic, "approval": approval})
}
