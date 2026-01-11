package storage

import (
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
)

// GET /storage/projects (Student - Read Only)
func ListProjectsStudent(c *gin.Context) {
	// Query parameters for filtering
	year := c.Query("year")
	keyword := c.Query("keyword")
	teacherID := c.Query("teacher_id")

	db := database.DB()
	
	// 1. Query ProjectStorage (ALL projects, optionally filter by teacher)
	var storageProjects []entity.ProjectStorage
	query1 := db.Preload("Teacher")
	
	if teacherID != "" {
		query1 = query1.Where("teacher_id = ?", teacherID)
	}
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

	// 2. Query Project (ALL Complete projects, optionally filter by teacher)
	var studentProjects []entity.Project
	query2 := db.Preload("TopicSelection.Topic").
		Preload("TopicSelection.GroupProject.Teacher").
		Joins("JOIN topic_selections ON topic_selections.id = projects.selection_id").
		Joins("JOIN group_projects ON group_projects.id = topic_selections.group_project_id").
		Where("projects.status = ?", "Complete")
	
	if teacherID != "" {
		query2 = query2.Where("group_projects.teacher_id = ?", teacherID)
	}
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



