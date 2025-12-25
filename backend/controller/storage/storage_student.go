package storage

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
)

// GET /storage/projects (Student - Read Only)
func ListProjectsStudent(c *gin.Context) {
	var projects []entity.ProjectStorage

	// Query parameters for filtering
	year := c.Query("year")
	keyword := c.Query("keyword")
	teacherID := c.Query("teacher_id")

	db := database.DB()
	query := db.Preload("Teacher")

	// Filter by year
	if year != "" {
		query = query.Where("year = ?", year)
	}

	// Filter by teacher_id
	if teacherID != "" {
		query = query.Where("teacher_id = ?", teacherID)
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

// GET /storage/projects/:id (Student - Read Only)
func GetProjectStudent(c *gin.Context) {
	var project entity.ProjectStorage
	id := c.Param("id")

	db := database.DB()
	if err := db.Preload("Teacher").First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": project})
}