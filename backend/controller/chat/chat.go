package chat

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
)

func GetProcessIDbyGroupID(c *gin.Context) {

	db := database.DB()
	var groupstr = c.Query("group_member_id")
	group, err := strconv.ParseUint(groupstr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, "invalid (blank) group project")
		return
	}
	var process []entity.Progress
	db.Raw("SELECT DISTINCT progresses.* FROM progresses JOIN chats ON progresses.id = chats.process_id WHERE chats.group_member_id = ?", group).Scan(&process)
	log.InsertLog(c, 7)
	c.JSON(http.StatusOK, &process)
}

func GetAllChat(c *gin.Context) {

	db := database.DB()
	var groupstr = c.Query("group_member_id")
	group, err := strconv.ParseUint(groupstr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, "invalid (blank) group project")
		return
	}

	var prostr = c.Query("process_id")
	pro, err := strconv.ParseUint(prostr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, "invalid (blank) progress_id ")
		return
	}

	var chat []entity.Chat
	db.Where("group_member_id = ? and process_id = ?", group, pro).Find(&chat)
	log.InsertLog(c, 8)

	c.JSON(http.StatusOK, &chat)

}

func InsertChat(c *gin.Context) {

	db := database.DB()

	var groupstr = c.Query("group_member_id")
	group, err := strconv.ParseUint(groupstr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, "invalid (blank) group project")
		return
	}

	var prostr = c.Query("process_id")
	pro, err := strconv.ParseUint(prostr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, "invalid (blank) group progress_id")
		return
	}

	var senderstr = c.Query("sender_id")
	sender, err := strconv.ParseUint(senderstr, 10, 64)
	if err != nil {
		c.JSON(400, gin.H{"error": "Blank sender id!"})
		return
	}

	var message = c.Query("messege")
	if message == "" {
		c.JSON(400, gin.H{"error": "blank messege at least type ' '"})
		return
	}

	Chat := []entity.Chat{
		{
			GroupMemberID: uint(group),
			ProcessID:     uint(pro),
			SenderID:      uint(sender),
			Message:       message,
		},
	}

	db.Create(&Chat)
	log.InsertLog(c, 9)
	c.JSON(http.StatusOK, &Chat)
}

func DeleteChat(c *gin.Context) {

	db := database.DB()
	var groupstr = c.Query("group_member_id")
	group, err := strconv.ParseUint(groupstr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, "invalid (blank) group project")
		return
	}

	var prostr = c.Query("process_id")
	pro, err := strconv.ParseUint(prostr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, "invalid (blank) progress_id ")
		return
	}

	var chatstr = c.Query("id")
	chatid, err := strconv.ParseUint(chatstr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, "invalid (blank) progress_id ")
		return
	}

	db.Where("group_member_id = ? and process_id = ? and id = ?", group, pro, chatid).Delete(&entity.Chat{})
	log.InsertLog(c, 10)

	c.JSON(http.StatusOK, "suscessfully to delete")

}
