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

	var groupstr = c.Query("group_project_id") 
	group, err := strconv.ParseUint(groupstr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid (blank) group project ID"})
		return
	}
	

	var processes []entity.Progress 
	

	result := db.Raw(`
        SELECT 
            p.id, p.created_at, p.updated_at, p.deleted_at, 
            p.group_project_id, p.file, p.comment 
        FROM progresses p
        WHERE p.group_project_id = ?
        ORDER BY p.id
    `, group).Scan(&processes)
    
    if result.Error != nil {

        c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error retrieving processes"})
        return
    }

	log.InsertLog(c, 7)
	c.JSON(http.StatusOK, &processes)
}

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




type UserGroupAccess struct {
    GroupProjectID uint `json:"group_project_id"`
    RoleName string `json:"role_name"`
}


func GetAccessIDByUserID(c *gin.Context) {
    db := database.DB()
    var user entity.User
    
   
    userIDstr := c.Query("user_id")
    userID, err := strconv.ParseUint(userIDstr, 10, 64)
    if err != nil || userID == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing user_id"})
        return
    }
    

    if err := db.Preload("Role").First(&user, userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    
 
    var accessID uint
    var roleName string
    
    if user.RoleID == 3 { // Student
        // Student accesses chat via their GroupMember entry -> GroupProjectID
        var groupMember entity.GroupMember
        db.Where("student_id = ?", userID).First(&groupMember)
        accessID = groupMember.GroupProjectID
        roleName = "Student"
        
    } else if user.RoleID == 2 { // Teacher/Advisor
        // Teacher/Advisor accesses chat via the GroupProject table
        var groupProject entity.GroupProject
        db.Where("teacher_id = ?", userID).First(&groupProject)
        accessID = groupProject.ID
        roleName = "Teacher"
        
    } else {
        c.JSON(http.StatusForbidden, gin.H{"error": "Access denied for this role"})
        return
    }
    
    if accessID == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "User is not assigned to a project group"})
        return
    }
    
    log.InsertLog(c, 11) 
    
    c.JSON(http.StatusOK, UserGroupAccess{
        GroupProjectID: accessID,
        RoleName: roleName,
    })
}