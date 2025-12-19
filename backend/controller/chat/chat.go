package chat

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
)




func GetAllChat(c *gin.Context) {

	db := database.DB()

	var groupstr = c.Query("group_project_id") 
	group, err := strconv.ParseUint(groupstr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) group project ID"})
		return
	}

	var prostr = c.Query("process_id")
	pro, err := strconv.ParseUint(prostr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) progress_id"})
		return
	}

	var chat []entity.Chat

	result := db.Where("group_project_id = ? and process_id = ?", group, pro).Find(&chat)
    
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error retrieving chats"})
        return
    }

	log.InsertLog(c, 8)
	c.JSON(http.StatusOK, &chat)
}



func InsertChat(c *gin.Context) {

	db := database.DB()


	var groupstr = c.Query("group_project_id")
	group, err := strconv.ParseUint(groupstr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) group project ID"})
		return
	}

	var prostr = c.Query("process_id")
	pro, err := strconv.ParseUint(prostr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) progress_id"})
		return
	}

	var senderstr = c.Query("sender_id")
	sender, err := strconv.ParseUint(senderstr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Blank sender id!"})
		return
	}

	var message = c.Query("messege")
	if message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "blank messege at least type ' '"})
		return
	}

	Chat := entity.Chat{ 
	
		GroupProjectID: uint(group),
		ProcessID: 	    uint(pro),
		SenderID: 	    uint(sender),
		Message: 	    message,
	}


	result := db.Create(&Chat)
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save chat"})
        return
    }

	log.InsertLog(c, 9)
	c.JSON(http.StatusOK, &Chat)
}

func DeleteChat(c *gin.Context) {

	db := database.DB()

	var groupstr = c.Query("group_project_id")
	group, err := strconv.ParseUint(groupstr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) group project ID"})
		return
	}

	var prostr = c.Query("process_id")
	pro, err := strconv.ParseUint(prostr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) progress_id"})
		return
	}

	var chatstr = c.Query("id")
	chatid, err := strconv.ParseUint(chatstr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) chat id"})
		return
	}


	result := db.Where("group_project_id = ? and process_id = ? and id = ?", group, pro, chatid).Delete(&entity.Chat{})

    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chat"})
        return
    }

	log.InsertLog(c, 10)
	c.JSON(http.StatusOK, gin.H{"message": "suscessfully to delete"}) 
}


func DeleteChatbyProgress(c *gin.Context){

	db := database.DB()

	var groupstr = c.Query("group_project_id")
	group, err := strconv.ParseUint(groupstr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) group project ID"})
		return
	}

	var prostr = c.Query("process_id")
	pro, err := strconv.ParseUint(prostr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) progress_id"})
		return
	}



	result := db.Where("group_project_id = ? and process_id = ? ", group, pro).Delete(&entity.Chat{})

    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chat"})
        return
    }

	log.InsertLog(c, 10)
	c.JSON(http.StatusOK, gin.H{"message": "suscessfully to delete"})
}