package chat

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
)

const socketBroadcastBaseURL = "http://socket:3001"

type InsertChatBody struct {
	GroupProjectID uint   `json:"group_project_id"`
	ProcessID      uint   `json:"process_id"`
	SenderID       uint   `json:"sender_id"`
	Message        string `json:"message"`
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

func GetAllChat(c *gin.Context) {
	db := database.DB()

	groupstr := c.Query("group_project_id")
	group, err := strconv.ParseUint(groupstr, 10, 64)
	if err != nil || group == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) group project ID"})
		return
	}

	prostr := c.Query("process_id")
	pro, err := strconv.ParseUint(prostr, 10, 64)
	if err != nil || pro == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) process_id"})
		return
	}

	var chats []entity.Chat
	result := db.Where("group_project_id = ? AND process_id = ?", group, pro).Order("id ASC").Find(&chats)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error retrieving chats"})
		return
	}

	log.InsertLog(c, 8)
	c.JSON(http.StatusOK, &chats)
}

func InsertChat(c *gin.Context) {
	db := database.DB()

	var body InsertChatBody
	_ = c.ShouldBindJSON(&body)

	if body.GroupProjectID == 0 {
		groupstr := c.Query("group_project_id")
		if v, err := strconv.ParseUint(groupstr, 10, 64); err == nil {
			body.GroupProjectID = uint(v)
		}
	}
	if body.ProcessID == 0 {
		prostr := c.Query("process_id")
		if v, err := strconv.ParseUint(prostr, 10, 64); err == nil {
			body.ProcessID = uint(v)
		}
	}
	if body.SenderID == 0 {
		senderstr := c.Query("sender_id")
		if v, err := strconv.ParseUint(senderstr, 10, 64); err == nil {
			body.SenderID = uint(v)
		}
	}

	if body.Message == "" {
		body.Message = c.Query("message")
	}
	if body.Message == "" {
		body.Message = c.Query("messege")
	}

	if body.GroupProjectID == 0 || body.ProcessID == 0 || body.SenderID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "miss id"})
		return
	}
	if body.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "blank message"})
		return
	}

	var sender entity.User
	db.Select("username").Where("id = ?", body.SenderID).First(&sender)

	chat := entity.Chat{
		GroupProjectID: body.GroupProjectID,
		ProcessID:      body.ProcessID,
		SenderID:       body.SenderID,
		Message:        body.Message,
		Name:           sender.Username,
	}

	result := db.Create(&chat)
	if result.Error != nil {
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
		"created_at":       chat.CreatedAt,
		"updated_at":       chat.UpdatedAt,
	})

	log.InsertLog(c, 9)
	c.JSON(http.StatusOK, &chat)
}

func DeleteChat(c *gin.Context) {
	db := database.DB()

	groupstr := c.Query("group_project_id")
	group, err := strconv.ParseUint(groupstr, 10, 64)
	if err != nil || group == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) group project ID"})
		return
	}

	prostr := c.Query("process_id")
	pro, err := strconv.ParseUint(prostr, 10, 64)
	if err != nil || pro == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) process_id"})
		return
	}

	chatstr := c.Query("id")
	chatid, err := strconv.ParseUint(chatstr, 10, 64)
	if err != nil || chatid == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) chat id"})
		return
	}

	result := db.Where("group_project_id = ? AND process_id = ? AND id = ?", group, pro, chatid).Delete(&entity.Chat{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chat"})
		return
	}

	rk := strconv.FormatUint(group, 10) + ":" + strconv.FormatUint(pro, 10)
	broadcast("/broadcast/delete", gin.H{
		"room_id": rk,
		"id":      chatid,
	})

	log.InsertLog(c, 10)
	c.JSON(http.StatusOK, gin.H{"message": "successfully deleted"})
}

func DeleteChatbyProgress(c *gin.Context) {
	db := database.DB()

	groupstr := c.Query("group_project_id")
	group, err := strconv.ParseUint(groupstr, 10, 64)
	if err != nil || group == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) group project ID"})
		return
	}

	prostr := c.Query("process_id")
	pro, err := strconv.ParseUint(prostr, 10, 64)
	if err != nil || pro == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) process_id"})
		return
	}

	result := db.Where("group_project_id = ? AND process_id = ?", group, pro).Delete(&entity.Chat{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chat"})
		return
	}

	log.InsertLog(c, 10)
	c.JSON(http.StatusOK, gin.H{"message": "successfully deleted"})
}

func GetGroupbyteacherid(c *gin.Context) {

	db := database.DB()

	userstr := c.Query("teacher_id")
	us, err := strconv.ParseUint(userstr, 10, 64)
	if err != nil || us == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) teacher ID"})
		return
	}

	var group_proj []entity.GroupProject

	result := db.Where("teacher_id = ? ", us).Find(&group_proj)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get id"})
		return
	}
	log.InsertLog(c, 4)
	c.JSON(http.StatusOK, group_proj)

}