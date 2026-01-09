package chat

import (
	"bytes"
	"encoding/json"
	"errors"
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
)

const socketBroadcastBaseURL = "http://socket:3001"

const (
	ChatTypeText  uint = 1
	ChatTypeFile  uint = 2
	MaxFileSize        = 20 * 1024 * 1024 // 20MB
	maxNameLen         = 120
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
	b, err := json.Marshal(payload)
	if err != nil {
		return
	}
	go func() {
		_, _ = http.Post(socketBroadcastBaseURL+path, "application/json", bytes.NewBuffer(b))
	}()
}


func sanitizeFilename(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "file"
	}


	name = filepath.Base(name)

	
	name = strings.ReplaceAll(name, "/", "_")
	name = strings.ReplaceAll(name, "\\", "_")


	var b strings.Builder
	b.Grow(len(name))
	for _, r := range name {
		if (r >= 'a' && r <= 'z') ||
			(r >= 'A' && r <= 'Z') ||
			(r >= '0' && r <= '9') ||
			r == '.' || r == '-' || r == '_' {
			b.WriteRune(r)
		} else {
			b.WriteRune('_')
		}
	}
	out := b.String()
	if out == "" {
		out = "file"
	}
	if len(out) > maxNameLen {
		out = out[:maxNameLen]
	}
	return out
}

func allowedUploadContentType(ct string) bool {
	
	switch ct {
	case "image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf","application/docx","":
		return true
	default:
		return false
	}
}


func GetFile(c *gin.Context) {
	original := sanitizeFilename(c.Query("filename"))

	
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, MaxFileSize)

	header := make([]byte, 512)
	n, readErr := io.ReadFull(c.Request.Body, header)
	if readErr != nil && !errors.Is(readErr, io.EOF) && !errors.Is(readErr, io.ErrUnexpectedEOF) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read upload"})
		return
	}
	header = header[:n]

	contentType := http.DetectContentType(header)
	if !allowedUploadContentType(contentType) {
		c.JSON(http.StatusForbidden, gin.H{"error": "File type not allowed "})
		fmt.Println(contentType)
		return
	}


	if err := os.MkdirAll(filepath.Join("uploads", "chats"), os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), original)
	finalPath := filepath.Join("uploads", "chats", filename)

	out, err := os.Create(finalPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file"})
		return
	}
	defer out.Close()


	if len(header) > 0 {
		if _, err := out.Write(header); err != nil {
			_ = os.Remove(finalPath)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write file"})
			return
		}
	}

	if _, err := io.Copy(out, c.Request.Body); err != nil {
		_ = os.Remove(finalPath)

		var mbe *http.MaxBytesError
		if errors.As(err, &mbe) {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "File too large (max 20MB)"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to save upload"})
		return
	}


	webPath := "/chatsave/" + filename

	c.JSON(http.StatusOK, gin.H{
		"status":       "ok",
		"url":          webPath,
		"content_type": contentType,
	})
}

func GetAllChat(c *gin.Context) {
	db := database.DB()

	groupStr := c.Query("group_project_id")
	group, err := strconv.ParseUint(groupStr, 10, 64)
	if err != nil || group == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) group project ID"})
		return
	}

	proStr := c.Query("process_id")
	pro, err := strconv.ParseUint(proStr, 10, 64)
	if err != nil || pro == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) process_id"})
		return
	}

	var chats []entity.Chat
	result := db.Where("group_project_id = ? AND process_id = ?", group, pro).
		Order("id ASC").
		Find(&chats)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error retrieving chats"})
		return
	}


	for i := range chats {
		if chats[i].ChatType == ChatTypeFile && strings.HasPrefix(chats[i].Message, "/chatsave/") {
			chats[i].Message = strings.Replace(chats[i].Message, "/chatsave/", "/uploads/chats/", 1)
		}
	}

	log.InsertLog(c, 8)
	c.JSON(http.StatusOK, &chats)
}

func InsertChat(c *gin.Context) {
	db := database.DB()

	var body InsertChatBody

	if err := c.ShouldBindJSON(&body); err != nil {

	}

	if body.GroupProjectID == 0 {
		if v, err := strconv.ParseUint(c.Query("group_project_id"), 10, 64); err == nil {
			body.GroupProjectID = uint(v)
		}
	}
	if body.ProcessID == 0 {
		if v, err := strconv.ParseUint(c.Query("process_id"), 10, 64); err == nil {
			body.ProcessID = uint(v)
		}
	}
	if body.SenderID == 0 {
		if v, err := strconv.ParseUint(c.Query("sender_id"), 10, 64); err == nil {
			body.SenderID = uint(v)
		}
	}
	if body.ChatType == 0 {
		if v, err := strconv.ParseUint(c.Query("type"), 10, 64); err == nil {
			body.ChatType = uint(v)
		}
	}
	if body.Message == "" {
		body.Message = c.Query("message")
	}
	if body.Message == "" {
		body.Message = c.Query("messege") 
	}


	if body.GroupProjectID == 0 || body.ProcessID == 0 || body.SenderID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing id(s)"})
		return
	}
	if strings.TrimSpace(body.Message) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "blank message"})
		return
	}
	if body.ChatType != ChatTypeText && body.ChatType != ChatTypeFile {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid chat type"})
		return
	}


	var sender entity.User
	if err := db.Select("username").Where("id = ?", body.SenderID).First(&sender).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid sender"})
		return
	}

	chat := entity.Chat{
		GroupProjectID: body.GroupProjectID,
		ProcessID:      body.ProcessID,
		SenderID:       body.SenderID,
		ChatType:       body.ChatType,
		Message:        body.Message,
		Name:           sender.Username,
	}

	if err := db.Create(&chat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save chat"})
		return
	}

	rk := roomKey(chat.GroupProjectID, chat.ProcessID)
	broadcast("/broadcast/chat", gin.H{
		"room_id":          rk,
		"id":               chat.ID,
		"group_project_id": chat.GroupProjectID,
		"process_id":       chat.ProcessID,
		"sender_id":        chat.SenderID,
		"name":             chat.Name,
		"message":          chat.Message,
		"chattype":         chat.ChatType,
		"created_at":       chat.CreatedAt,
		"updated_at":       chat.UpdatedAt,
	})

	log.InsertLog(c, 9)
	c.JSON(http.StatusOK, &chat)
}

func DeleteChat(c *gin.Context) {
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

	chatID, err := strconv.ParseUint(c.Query("id"), 10, 64)
	if err != nil || chatID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) chat id"})
		return
	}

	

	result := db.Where("group_project_id = ? AND process_id = ? AND id = ?", group, pro, chatID).
		Delete(&entity.Chat{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chat"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "chat not found"})
		return
	}

	rk := strconv.FormatUint(group, 10) + ":" + strconv.FormatUint(pro, 10)
	broadcast("/broadcast/delete", gin.H{
		"room_id": rk,
		"id":      chatID,
	})

	log.InsertLog(c, 10)
	c.JSON(http.StatusOK, gin.H{"message": "successfully deleted"})
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
		"message":        "successfully deleted",
		"rows_affected":  result.RowsAffected,
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
