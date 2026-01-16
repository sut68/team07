package chat

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/utils"
)

const (
	socketBroadcastBaseURL = "http://socket:3001"
	ChatTypeText           = 1
	ChatTypeFile           = 2
	MaxFileSize            = 20 * 1024 * 1024
	maxNameLen             = 120
	ChatBucket             = "chat-uploads"
)


type InsertChatBody struct {
	GroupProjectID uint   `json:"group_project_id"`
	ProcessID      uint   `json:"process_id"`
	SenderID       uint   `json:"sender_id"`
	Message        string `json:"message"`
	ChatType       uint   `json:"type"`
}

func roomKey(gp uint, pid uint) string {
	return strconv.FormatUint(uint64(gp), 10) + ":" + strconv.FormatUint(uint64(pid), 10)
}

func broadcast(path string, payload any) {
	b, _ := json.Marshal(payload)
	go func() {
		client := &http.Client{Timeout: 5 * time.Second}
		_, _ = client.Post(socketBroadcastBaseURL+path, "application/json", bytes.NewBuffer(b))
	}()
}

func sanitizeFilename(name string) string {
	name = filepath.Base(strings.TrimSpace(name))
	var b strings.Builder
	for _, r := range name {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '.' || r == '-' || r == '_' {
			b.WriteRune(r)
		} else {
			b.WriteRune('_')
		}
	}
	out := b.String()
	if len(out) > maxNameLen {
		out = out[:maxNameLen]
	}
	return out
}

func allowedUploadContentType(ct string, filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ct {
	case "image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf":
		return true
	case "application/zip", "application/x-zip-compressed":
		return ext == ".docx" || ext == ".xlsx" || ext == ".pptx"
	default:
		return false
	}
}

// --- Controller Actions ---

func GetFile(c *gin.Context) {
	originalName := sanitizeFilename(c.Query("filename"))
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, MaxFileSize)

	header := make([]byte, 512)
	n, err := c.Request.Body.Read(header)
	if err != nil && err != io.EOF {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file"})
		return
	}
	if n == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Empty file"})
		return
	}

	contentType := http.DetectContentType(header[:n])

	if !allowedUploadContentType(contentType, originalName) {
		c.JSON(http.StatusForbidden, gin.H{"error": "File type not allowed"})
		return
	}

	combinedBody := io.MultiReader(bytes.NewReader(header[:n]), c.Request.Body)

	// อัปโหลดไป Azure ("chats")
	azureURL, err := utils.UploadToAzure(combinedBody, originalName, "chats")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cloud Storage Error: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":       "ok",
		"url":          azureURL,
		"content_type": contentType,
	})
}

func GetAllChat(c *gin.Context) {
	db := database.DB()
	group, _ := strconv.ParseUint(c.Query("group_project_id"), 10, 64)
	pro, _ := strconv.ParseUint(c.Query("process_id"), 10, 64)

	var chats []entity.Chat
	if err := db.Where("group_project_id = ? AND process_id = ?", group, pro).Order("id ASC").Find(&chats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB Error"})
		return
	}

	log.InsertLog(c, 8)
	c.JSON(http.StatusOK, &chats)
}

func InsertChat(c *gin.Context) {
	db := database.DB()
	var body InsertChatBody
	_ = c.ShouldBindJSON(&body)

	if body.GroupProjectID == 0 || body.SenderID == 0 || body.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing data"})
		return
	}

	var sender entity.User
	db.Select("username").Where("id = ?", body.SenderID).First(&sender)

	chat := entity.Chat{
		GroupProjectID: body.GroupProjectID,
		ProcessID:      body.ProcessID,
		SenderID:       body.SenderID,
		ChatType:       body.ChatType,
		Message:        body.Message,
		Name:           sender.Username,
	}

	if err := db.Create(&chat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Save failed"})
		return
	}

	broadcast("/broadcast/chat", gin.H{
		"id":               chat.ID,
		"room_id":          roomKey(chat.GroupProjectID, chat.ProcessID),
		"group_project_id": chat.GroupProjectID,
		"process_id":       chat.ProcessID,
		"sender_id":        chat.SenderID,
		"name":             chat.Name,
		"message":          chat.Message,
		"type":             chat.ChatType,
		"created_at":       chat.CreatedAt,
		"updated_at":       chat.UpdatedAt,
	})

	log.InsertLog(c, 9)
	c.JSON(http.StatusOK, &chat)
}

func DeleteChat(c *gin.Context) {
	db := database.DB()
	id, _ := strconv.ParseUint(c.Query("id"), 10, 64)

	var chat entity.Chat
	if err := db.Where("id = ?", id).First(&chat).Error; err == nil {
		db.Delete(&chat)
	}

	broadcast("/broadcast/delete", gin.H{"id": id})
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func DeleteChatbyProgress(c *gin.Context) {
	db := database.DB()

	group, err := strconv.ParseUint(c.Query("group_project_id"), 10, 64)
	if err != nil || group == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) group project ID"})
		return
	}

	pro, err := strconv.ParseUint(c.Query("process_id"), 10, 64)
	if err != nil || pro == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) process_id"})
		return
	}

	result := db.Where("group_project_id = ? AND process_id = ?", group, pro).Delete(&entity.Chat{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chats"})
		return
	}

	log.InsertLog(c, 10)
	c.JSON(http.StatusOK, gin.H{
		"message":       "successfully deleted",
		"rows_affected": result.RowsAffected,
	})
}

func GetGroupbyteacherid(c *gin.Context) {
	db := database.DB()

	teacherID, err := strconv.ParseUint(c.Query("teacher_id"), 10, 64)
	if err != nil || teacherID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) teacher ID"})
		return
	}

	var groupProj []entity.GroupProject
	result := db.Where("teacher_id = ?", teacherID).Find(&groupProj)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get group projects"})
		return
	}

	log.InsertLog(c, 4)
	c.JSON(http.StatusOK, groupProj)
}
