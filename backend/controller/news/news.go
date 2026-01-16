package news

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
	"github.com/sut68/team07/backend/utils"
)

func CreateNews(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if claims.Role != "Teacher" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only teachers can create news"})
		return
	}

	title := c.PostForm("title")
	description := c.PostForm("description")
	category := c.PostForm("category")

	if title == "" || description == "" || category == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title, Description, and Category are required"})
		return
	}

	var filePath string
	file, fileHeader, err := c.Request.FormFile("file")
	if err == nil {
		defer file.Close()
		// อัปโหลดขึ้น Azure ("news")
		azureURL, err := utils.UploadToAzure(file, fileHeader.Filename, "news")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file to Azure: " + err.Error()})
			return
		}
		filePath = azureURL
	}
	// ไม่ต้องแปลง path เป็น filepath.ToSlash แล้ว เพราะ URL เป็น string ปกติ
	news := entity.News{
		Title:       title,
		Description: description,
		Category:    category,
		File:        filePath,
		TeacherID:   claims.ID,
	}

	if err := database.DB().Create(&news).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.InsertLog(c, 44)
	c.JSON(http.StatusCreated, gin.H{"data": news})
}

func UpdateNews(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id := c.Param("id")
	var news entity.News
	if err := database.DB().First(&news, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "News not found"})
		return
	}

	if news.TeacherID != claims.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only edit your own news"})
		return
	}

	title := c.PostForm("title")
	description := c.PostForm("description")
	category := c.PostForm("category")

	if title != "" {
		news.Title = title
	}
	if description != "" {
		news.Description = description
	}
	if category != "" {
		news.Category = category
	}

	file, fileHeader, err := c.Request.FormFile("file")
	if err == nil {
		defer file.Close()
		
		// อัปโหลดขึ้น Azure ("news")
		azureURL, err := utils.UploadToAzure(file, fileHeader.Filename, "news")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file to Azure: " + err.Error()})
			return
		}
		news.File = azureURL
	}

	if err := database.DB().Save(&news).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.InsertLog(c, 45)

	c.JSON(http.StatusOK, gin.H{"data": news})
}

func DeleteNews(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id := c.Param("id")
	var news entity.News
	if err := database.DB().First(&news, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "News not found"})
		return
	}

	if news.TeacherID != claims.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own news"})
		return
	}

	if news.File != "" {
		os.Remove(news.File)
		// Try to remove the directory if it's empty
		dir := filepath.Dir(news.File)
		os.Remove(dir)
	}

	if err := database.DB().Delete(&news).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.InsertLog(c, 46)

	c.JSON(http.StatusOK, gin.H{"data": "News deleted successfully"})
}

func GetNews(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var newsList []entity.News

	if claims.Role == "Teacher" {
		if err := database.DB().Preload("Teacher").Where("category = ? OR teacher_id = ?", "General", claims.ID).Order("created_at desc").Find(&newsList).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

	} else if claims.Role == "Student" {
		var groupMember entity.GroupMember
		if err := database.DB().Preload("GroupProject").Where("student_id = ?", claims.ID).First(&groupMember).Error; err != nil {
			if err := database.DB().Preload("Teacher").Where("category = ?", "General").Order("created_at desc").Find(&newsList).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"data": newsList})
			return
		}

		advisorID := groupMember.GroupProject.TeacherID

		if advisorID == nil {
			if err := database.DB().Preload("Teacher").Where("category = ?", "General").Order("created_at desc").Find(&newsList).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else {
			if err := database.DB().Preload("Teacher").Where("category = ? OR (category = ? AND teacher_id = ?)", "General", "Advisor", *advisorID).Order("created_at desc").Find(&newsList).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
	} else {
		if err := database.DB().Preload("Teacher").Where("category = ?", "General").Order("created_at desc").Find(&newsList).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": newsList})
}
