package group

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
	"gorm.io/gorm"
)

type CreateMemberInput struct {
	GroupProjectID uint `json:"group_project_id" binding:"required"`
	// StudentID      uint `json:"student_id" binding:"required"`
}

func GetGroupProject(c *gin.Context) {
	db := database.DB()
	var group []entity.GroupProject

	query := db.Preload("Teacher").
		Preload("GroupMembers", func(db *gorm.DB) *gorm.DB {
			return db.Order("leader desc, id asc")
		}).
		Preload("GroupMembers.Student")

	year := c.Query("year")

	// ถ้ามีการส่ง year มา ให้เพิ่มเงื่อนไข WHERE
	if year != "" {
		query = query.Where("year = ?", year)
	}

	query = query.Order("group_number asc")

	if err := query.Find(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, &group)
}

// ดึงปีการศึกษาทั้งหมดที่มีในระบบ
func GetAcademicYears(c *gin.Context) {
	db := database.DB()
	var years []int

	// ดึงเฉพาะ column year ที่ไม่ซ้ำกัน และเรียงจากมากไปน้อย
	result := db.Model(&entity.GroupProject{}).
		Distinct("year").
		Order("year desc").
		Pluck("year", &years)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, years)
}

// ดึงข้อมูลสมาชิกทั้งหมด
func GetGroupMember(c *gin.Context) {
	db := database.DB()
	var member []entity.GroupMember

	db.Preload("Student").Preload("GroupProject").Find(&member)

	c.JSON(http.StatusOK, &member)
}

func PostGroupMember(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Please log in"})
		return
	}

	studentID := claims.ID
	db := database.DB()

	var input CreateMemberInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user entity.User
	if err := db.First(&user, studentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลนักศึกษา"})
		return
	}

	if user.Pass == nil || *user.Pass { // *user.Pass == True
		c.JSON(http.StatusBadRequest, gin.H{"error": "คุณไม่ผ่านเกณฑ์เข้าร่วมกลุ่ม"}) // (Pass ไม่ใช่ False)
		return
	}

	if user.StatusID != 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "สถานะบัญชีของคุณไม่ถูกต้อง"}) // (ต้องเป็น Active)
		return
	}

	var groupProject entity.GroupProject
	if err := db.First(&groupProject, input.GroupProjectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project group not found"})
		return
	}

	//เช็คว่านักศึกษาคนนี้ มีกลุ่มอยู่ใน "ปีการศึกษาเดียวกัน" หรือยัง?
	var existingCount int64
	err = db.Table("group_members").
		Joins("JOIN group_projects ON group_members.group_project_id = group_projects.id").
		Where("group_members.student_id = ? AND group_projects.year = ? AND group_members.deleted_at IS NULL", studentID, groupProject.Year).
		Count(&existingCount).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if existingCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "คุณมีกลุ่มในปีการศึกษานี้อยู่แล้ว"})
		return
	}

	var currentMemberCount int64
	db.Model(&entity.GroupMember{}).Where("group_project_id = ?", input.GroupProjectID).Count(&currentMemberCount)

	if currentMemberCount >= int64(groupProject.Membership) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This group is full"})
		return
	}

	// กำหนด Leader
	isLeader := false
	if currentMemberCount == 0 {
		isLeader = true
	}

	newMember := entity.GroupMember{
		GroupProjectID: input.GroupProjectID,
		StudentID:      studentID,
		Leader:         isLeader,
	}

	if err := db.Create(&newMember).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Joined group successfully",
		"data":    newMember,
	})
}

func GetMyGroup(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Please log in"})
		return
	}
	studentID := claims.ID
	db := database.DB()

	var member entity.GroupMember
	if err := db.
		Preload("GroupProject").
		Preload("GroupProject.Teacher").
		Preload("GroupProject.GroupMembers").
		Preload("GroupProject.GroupMembers.Student").
		Joins("JOIN group_projects ON group_members.group_project_id = group_projects.id").
		Where("student_id = ?", studentID).
		Order("group_projects.year DESC").
		First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "คุณยังไม่มีกลุ่มโปรเจค"})
		return
	}
	group := member.GroupProject

	c.JSON(http.StatusOK, gin.H{
		"data": group,
	})
}
