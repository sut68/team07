package people

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	//"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"golang.org/x/crypto/bcrypt"
)

// --- Payload Struct with Honeypot ---
type CreateUserPayload struct {
	entity.User        
	IsPeople    string `json:"ispeople"` 
}

func CreateUser(c *gin.Context) {
	// 1. Setup Database
	db := database.DB()

	// 2. Bind JSON to the Payload (checking for the trap)
	var payload CreateUserPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}


	if payload.IsPeople != "" {
		fmt.Printf("[SECURITY] Bot detected via Honeypot in CreateUser! Payload: %s\n", payload.IsPeople)


		c.JSON(http.StatusCreated, gin.H{
			"status":  "success",
			"message": "status is confirm you are human this messege is testing ", // Lie to the bot
			"data":    payload.User,
		})
		return
	}

	// 4. Hash Password (Security Best Practice)
	// Never save passwords in plain text!
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(payload.Password), 14)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}
	payload.User.Password = string(hashedPassword)

	// 5. Save Real User to Database
	// We map the payload back to the entity.User automatically via embedding
	if err := db.Create(&payload.User).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// 6. Log and Return Success
	// Assuming '1' is the action ID for 'Create User'
	//log.InsertLog(c, 1) 
	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": payload.User})
}