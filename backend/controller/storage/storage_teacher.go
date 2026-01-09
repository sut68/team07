package storage

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
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

	log.InsertLog(c, 48)
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

	// 1. Query ProjectStorage (teacher's own projects)
	var storageProjects []entity.ProjectStorage
	query1 := db.Preload("Teacher").Where("teacher_id = ?", claims.ID)

	if year != "" {
		query1 = query1.Where("year = ?", year)
	}
	if keyword != "" {
		searchPattern := "%" + keyword + "%"
		query1 = query1.Where("title LIKE ? OR abstract LIKE ? OR keywords LIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	if err := query1.Find(&storageProjects).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2. Query Project (student projects where teacher is advisor)
	var studentProjects []entity.Project
	query2 := db.Preload("TopicSelection.Topic").
		Preload("TopicSelection.GroupProject.Teacher").
		Joins("JOIN topic_selections ON topic_selections.id = projects.selection_id").
		Joins("JOIN group_projects ON group_projects.id = topic_selections.group_project_id").
		Where("projects.status = ?", "Complete").
		Where("group_projects.teacher_id = ?", claims.ID)

	if year != "" {
		query2 = query2.Where("projects.year = ?", year)
	}
	if keyword != "" {
		searchPattern := "%" + keyword + "%"
		query2 = query2.Where("projects.title LIKE ? OR projects.abstract LIKE ? OR projects.keywords LIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	if err := query2.Find(&studentProjects).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3. Merge results into common format
	type ProjectResponse struct {
		ID        uint      `json:"id"`
		Title     string    `json:"title"`
		Abstract  string    `json:"abstract"`
		Keywords  string    `json:"keywords"`
		Year      int       `json:"year"`
		FilePath  string    `json:"file_path"`
		TeacherID uint      `json:"teacher_id"`
		Source    string    `json:"source"`
		CreatedAt time.Time `json:"created_at"`
	}

	var results []ProjectResponse

	// Add ProjectStorage items
	for _, p := range storageProjects {
		results = append(results, ProjectResponse{
			ID:        p.ID,
			Title:     p.Title,
			Abstract:  p.Abstract,
			Keywords:  p.Keywords,
			Year:      p.Year,
			FilePath:  p.FilePath,
			TeacherID: p.TeacherID,
			Source:    "manual",
			CreatedAt: p.CreatedAt,
		})
	}

	// Add Project items
	for _, p := range studentProjects {
		var teacherID uint
		if p.TopicSelection != nil && p.TopicSelection.GroupProject != nil && p.TopicSelection.GroupProject.TeacherID != nil {
			teacherID = *p.TopicSelection.GroupProject.TeacherID
		}

		results = append(results, ProjectResponse{
			ID:        p.ID,
			Title:     p.Title,
			Abstract:  p.Abstract,
			Keywords:  p.Keywords,
			Year:      p.Year,
			FilePath:  p.FilePath,
			TeacherID: teacherID,
			Source:    "student",
			CreatedAt: p.CreatedAt,
		})
	}

	// 4. Sort by year DESC, then by created_at DESC
	sort.Slice(results, func(i, j int) bool {
		if results[i].Year != results[j].Year {
			return results[i].Year > results[j].Year
		}
		return results[i].CreatedAt.After(results[j].CreatedAt)
	})

	c.JSON(http.StatusOK, gin.H{"data": results})
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

	log.InsertLog(c, 49)
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
	log.InsertLog(c, 50)

	c.JSON(http.StatusOK, gin.H{"data": id})
}
