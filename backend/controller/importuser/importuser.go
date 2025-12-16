package importuser

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/service"
)

func ImportUsersHandler(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot read file"})
		return
	}

	// Create temp folder
	if err := os.MkdirAll("./temp", 0755); err != nil {
		c.JSON(500, gin.H{"error": "Cannot create temp folder"})
		return
	}

	tempPath := "./temp/" + file.Filename

	// Save file safely
	if err := c.SaveUploadedFile(file, tempPath); err != nil {
		c.JSON(500, gin.H{"error": "Failed to save file"})
		return
	}

	// Remove file after finished
	defer os.Remove(tempPath)

	imported, errs, err := service.ImportUsersFromFile(tempPath)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"imported": imported,
		"errors":   errs,
	})
}
//yeah