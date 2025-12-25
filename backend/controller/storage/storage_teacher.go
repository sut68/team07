package storage

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
)

// POST /storage/projects
func CreateProject(c *gin.Context) {
	var project entity.ProjectStorage

	// Parse form data
	project.Title = c.PostForm("title")
	project.Abstract = c.PostForm("abstract")
	project.Keywords = c.PostForm("keywords")

	// Parse year
	if yearStr := c.PostForm("year"); yearStr != "" {
		if year, err := strconv.Atoi(yearStr); err == nil {
			project.Year = year
		}
	}
	
	// Get teacher_id from authenticated user
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	project.TeacherID = claims.ID

	// Handle file upload
	file, err := c.FormFile("file")
	if err == nil {
		// Create upload directory if not exists
		uploadPath := "uploads/projects"
		if _, err := os.Stat(uploadPath); os.IsNotExist(err) {
			os.MkdirAll(uploadPath, 0755)
		}

		// Generate unique filename
		filename := fmt.Sprintf(
			"%d_%s",
			time.Now().UnixNano(),
			filepath.Base(file.Filename),
		)
		filePath := filepath.Join(uploadPath, filename)

		// Save file
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to save file"})
			return
		}

		project.FilePath = filename
	}

	// Save to database
	db := database.DB()
	if err := db.Create(&project).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Preload teacher data
	db.Preload("Teacher").First(&project, project.ID)

	c.JSON(http.StatusOK, gin.H{"data": project})
}

// GET /storage/projects/:id
func GetProject(c *gin.Context) {
	var project entity.ProjectStorage
	id := c.Param("id")

	db := database.DB()
	if err := db.Preload("Teacher").First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": project})
}

// GET /storage/projects
func ListProjects(c *gin.Context) {
	var projects []entity.ProjectStorage

	// Get teacher_id from authenticated user
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Query parameters for filtering
	year := c.Query("year")
	keyword := c.Query("keyword")

	db := database.DB()
	query := db.Preload("Teacher")

	// Filter by authenticated teacher's ID
	query = query.Where("teacher_id = ?", claims.ID)

	// Filter by year
	if year != "" {
		query = query.Where("year = ?", year)
	}

	// Filter by keyword (search in title, abstract, keywords)
	if keyword != "" {
		searchPattern := "%" + keyword + "%"
		query = query.Where(
			"title LIKE ? OR abstract LIKE ? OR keywords LIKE ?",
			searchPattern, searchPattern, searchPattern,
		)
	}

	// Execute query
	if err := query.Order("year DESC, created_at DESC").Find(&projects).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": projects})
}

// PATCH /storage/projects/:id
func UpdateProject(c *gin.Context) {
	var project entity.ProjectStorage
	id := c.Param("id")

	db := database.DB()

	// Find existing project
	if err := db.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	// Update fields from form data
	if title := c.PostForm("title"); title != "" {
		project.Title = title
	}
	if abstract := c.PostForm("abstract"); abstract != "" {
		project.Abstract = abstract
	}
	if keywords := c.PostForm("keywords"); keywords != "" {
		project.Keywords = keywords
	}
	if yearStr := c.PostForm("year"); yearStr != "" {
		if year, err := strconv.Atoi(yearStr); err == nil {
			project.Year = year
		}
	}

	// Handle file upload (if new file provided)
	file, err := c.FormFile("file")
	if err == nil {
		uploadPath := "uploads/projects"
		if _, err := os.Stat(uploadPath); os.IsNotExist(err) {
			os.MkdirAll(uploadPath, 0755)
		}

		filename := fmt.Sprintf(
			"%d_%s",
			time.Now().UnixNano(),
			filepath.Base(file.Filename),
		)
		filePath := filepath.Join(uploadPath, filename)

		if err := c.SaveUploadedFile(file, filePath); err == nil {
			// Delete old file if exists
			if project.FilePath != "" {
				oldPath := filepath.Join(uploadPath, project.FilePath)
				os.Remove(oldPath)
			}
			project.FilePath = filename
		}
	}

	// Save changes
	if err := db.Save(&project).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Reload with teacher data
	db.Preload("Teacher").First(&project, project.ID)

	c.JSON(http.StatusOK, gin.H{"data": project})
}

// DELETE /storage/projects/:id
func DeleteProject(c *gin.Context) {
	id := c.Param("id")
	db := database.DB()

	var project entity.ProjectStorage
	if err := db.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	// Delete associated file if exists
	if project.FilePath != "" {
		filePath := filepath.Join("uploads/projects", project.FilePath)
		os.Remove(filePath)
	}

	// Delete from database
	if err := db.Delete(&project).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": id})
}
