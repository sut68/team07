package project

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/asaskevich/govalidator"
	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
	"github.com/sut68/team07/backend/utils"
)

// CreateProject - สร้างข้อมูลโครงงาน (นักศึกษากรอกข้อมูล)
func CreateProject(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := database.DB()

	// ตรวจสอบว่านักศึกษาอยู่ในกลุ่มหรือไม่
	var member entity.GroupMember
	if err := db.Preload("GroupProject").
		Where("student_id = ?", claims.ID).
		First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "You do not belong to any project group"})
		return
	}

	groupID := member.GroupProjectID

	// ตรวจสอบว่ามี TopicSelection ที่ Active หรือไม่
	var selection entity.TopicSelection
	if err := db.Preload("Topic").
		Preload("GroupProject").
		Where("group_project_id = ? AND status = ?", groupID, "Active").
		First(&selection).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active topic selection found for your group. Please select a topic first."})
		return
	}

	// เพิ่มการตรวจสอบ: ต้องเป็น Completed เท่านั้นถึงจะกรอกข้อมูลได้
	if selection.GroupProject.GroupStatus != "Completed" {
		c.JSON(http.StatusForbidden, gin.H{"error": "คุณสามารถกรอกข้อมูลโครงงานได้หลังจากที่กลุ่มมีสถานะ 'Completed' (ผ่านการประเมิน) แล้วเท่านั้น"})
		return
	}

	// ตรวจสอบว่ามี Project อยู่แล้วหรือไม่
	var existingProject entity.Project
	if err := db.Where("selection_id = ?", selection.ID).First(&existingProject).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Project information already exists. Please update instead."})
		return
	}

	// รับข้อมูลจาก form
	abstract := c.PostForm("abstract")
	keywords := c.PostForm("keywords")
	
	// ดึงข้อมูลจาก Topic และ GroupProject
	title := selection.Topic.Title
	year := selection.GroupProject.Year

	// จัดการไฟล์อัปโหลด
	var filePath string
	file, fileHeader, err := c.Request.FormFile("project_document")
	if err == nil {
		defer file.Close()
		// อัปโหลดขึ้น Azure
		pdfURL, err := utils.UploadToAzure(file, fileHeader.Filename, "projects")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file to Azure: " + err.Error()})
			return
		}
		filePath = pdfURL
	} else {
		// ไม่มีไฟล์ - ใช้ค่าว่าง
		filePath = ""
	}

	// สร้าง Project object
	project := entity.Project{
		Title:       title,
		Abstract:    abstract,
		Keywords:    keywords,
		Year:        year,
		Status:      "Pending", // เปลี่ยนสถานะเป็น Pending Publish เพื่อรออาจารย์อนุมัติลงคลัง
		FilePath:    filePath,
		SelectionID: selection.ID,
	}

	// Validate
	if _, err := govalidator.ValidateStruct(project); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// บันทึกลงฐานข้อมูล
	if err := db.Create(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
		return
	}
	log.InsertLog(c, 48)	
	c.JSON(http.StatusCreated, gin.H{
		"message": "Project created successfully",
		"data":    project,
	})
}

// GetMyProject - ดึงข้อมูลโครงงานของนักศึกษา
func GetMyProject(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := database.DB()

	// ตรวจสอบว่านักศึกษาอยู่ในกลุ่มหรือไม่
	var member entity.GroupMember
	if err := db.Where("student_id = ?", claims.ID).First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "You do not belong to any project group"})
		return
	}

	groupID := member.GroupProjectID
	fmt.Printf("DEBUG: Student ID: %d, Group ID: %d\n", claims.ID, groupID)

	// ดึง TopicSelection (ไม่จำกัด status เพื่อให้หาได้ทุกกรณี)
	var selection entity.TopicSelection
	if err := db.Where("group_project_id = ?", groupID).
		Order("created_at DESC").
		First(&selection).Error; err != nil {
		fmt.Printf("DEBUG: No TopicSelection found for group %d: %v\n", groupID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "No topic selection found"})
		return
	}

	fmt.Printf("DEBUG: Found TopicSelection ID: %d, Status: %s\n", selection.ID, selection.Status)

	// ดึง Project
	var project entity.Project
	if err := db.Preload("TopicSelection.Topic").
		Preload("TopicSelection.GroupProject").
		Where("selection_id = ?", selection.ID).
		First(&project).Error; err != nil {
		fmt.Printf("DEBUG: No Project found for selection_id %d: %v\n", selection.ID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "No project information found"})
		return
	}

	fmt.Printf("DEBUG: Found Project ID: %d, Title: %s\n", project.ID, project.Title)
	c.JSON(http.StatusOK, gin.H{"data": project})
}

// UpdateProject - แก้ไขข้อมูลโครงงาน
func UpdateProject(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	projectID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	db := database.DB()

	// ตรวจสอบว่านักศึกษาอยู่ในกลุ่มหรือไม่
	var member entity.GroupMember
	if err := db.Where("student_id = ?", claims.ID).First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "You do not belong to any project group"})
		return
	}

	// เพิ่มการตรวจสอบ: ต้องเป็น Completed เท่านั้นถึงจะแก้ไขข้อมูลได้
	var groupProject entity.GroupProject
	if err := db.Select("group_status").First(&groupProject, member.GroupProjectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group information not found"})
		return
	}

	if groupProject.GroupStatus != "Completed" {
		c.JSON(http.StatusForbidden, gin.H{"error": "คุณสามารถแก้ไขข้อมูลโครงงานได้เมื่อสถานะกลุ่มเป็น 'Completed' แล้วเท่านั้น"})
		return
	}

	// ดึง Project และตรวจสอบสิทธิ์
	var project entity.Project
	if err := db.Preload("TopicSelection").
		Where("id = ?", projectID).
		First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	// ตรวจสอบว่า Project นี้เป็นของกลุ่มนักศึกษาหรือไม่
	if project.TopicSelection.GroupProjectID != member.GroupProjectID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to update this project"})
		return
	}

	// รับข้อมูลจาก form
	if abstract := c.PostForm("abstract"); abstract != "" {
		project.Abstract = abstract
	}
	if keywords := c.PostForm("keywords"); keywords != "" {
		project.Keywords = keywords
	}
	if status := c.PostForm("status"); status != "" {
		project.Status = status
	}

	// จัดการไฟล์อัปโหลดใหม่
	file, fileHeader, err := c.Request.FormFile("project_document")
	if err == nil {
		defer file.Close()
		// อัปโหลดขึ้น Azure
		pdfURL, err := utils.UploadToAzure(file, fileHeader.Filename, "projects")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file to Azure: " + err.Error()})
			return
		}
		project.FilePath = pdfURL
	}

	// Validate
	if _, err := govalidator.ValidateStruct(project); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// บันทึกการเปลี่ยนแปลง
	if err := db.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project"})
		return
	}
	log.InsertLog(c, 49)	
	c.JSON(http.StatusOK, gin.H{
		"message": "Project updated successfully",
		"data":    project,
	})
}
