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

// GET: ดึงข้อมูลกลุ่มทั้งหมด (พร้อม Filter ปี)
func GetGroupProject(c *gin.Context) {
	db := database.DB()
	var group []entity.GroupProject

	// 1. สร้าง Query ตั้งต้น
	query := db.Preload("Teacher").
		Preload("GroupMembers", func(db *gorm.DB) *gorm.DB {
			return db.Order("leader desc, id asc")
		}).
		Preload("GroupMembers.Student")

	// 2. รับค่า year
	year := c.Query("year")

	// 3. ถ้ามีการส่ง year มา ให้เพิ่มเงื่อนไข WHERE
	if year != "" {
		query = query.Where("year = ?", year)
	}

	query = query.Order("group_number asc")

	// 4. สั่งค้นหา
	if err := query.Find(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, &group)
}

// GET: ดึงปีการศึกษาทั้งหมดที่มีในระบบ
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

// GET: ดึงข้อมูลสมาชิกทั้งหมด
func GetGroupMember(c *gin.Context) {
	db := database.DB()
	var member []entity.GroupMember

	// Preload ข้อมูลนักศึกษาและโปรเจค
	db.Preload("Student").Preload("GroupProject").Find(&member)

	c.JSON(http.StatusOK, &member)
}

// POST: นักศึกษากดเข้าร่วมกลุ่ม (Join Group)
func PostGroupMember(c *gin.Context) {
	// --- 1. ตรวจสอบสิทธิ์ (Authentication) ---
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Please log in"})
		return
	}

	studentID := claims.ID
	db := database.DB()

	// 2. รับค่า Input (เหลือแค่ Group ID)
	var input CreateMemberInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// เช็คว่าผ่านเกณไหม
	var user entity.User
	if err := db.First(&user, studentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลนักศึกษา"})
		return
	}

	// เงื่อนไขที่ 1: Pass ต้องเป็น false
	// (ต้องเช็ค nil ก่อนเพื่อกัน panic กรณีข้อมูลเป็น null)
	if user.Pass == nil || *user.Pass { // *user.Pass == True
		c.JSON(http.StatusBadRequest, gin.H{"error": "คุณไม่ผ่านเกณฑ์เข้าร่วมกลุ่ม"}) // (Pass ไม่ใช่ False)
		return
	}

	// เงื่อนไขที่ 2: StatusID เป็น 2 (Inactive)
	if user.StatusID != 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "สถานะบัญชีของคุณไม่ถูกต้อง"}) // (ต้องเป็น Active)
		return
	}

	// 3. ตรวจสอบว่ากลุ่มที่จะเข้า มีอยู่จริงหรือไม่?
	var groupProject entity.GroupProject
	if err := db.First(&groupProject, input.GroupProjectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project group not found"})
		return
	}

	// --- 4. เช็คว่านักศึกษาคนนี้ มีกลุ่มอยู่ใน "ปีการศึกษาเดียวกัน" หรือยัง? ---
	var existingCount int64
	err = db.Table("group_members").
		Joins("JOIN group_projects ON group_members.group_project_id = group_projects.id").
		Where("group_members.student_id = ? AND group_projects.year = ?", studentID, groupProject.Year).
		Count(&existingCount).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if existingCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "คุณมีกลุ่มในปีการศึกษานี้อยู่แล้ว"})
		return
	}

	// 5. นับจำนวนสมาชิกปัจจุบันในกลุ่มที่จะเข้า
	var currentMemberCount int64
	db.Model(&entity.GroupMember{}).Where("group_project_id = ?", input.GroupProjectID).Count(&currentMemberCount)

	// 6. เช็คว่ากลุ่มเต็มหรือยัง?
	if currentMemberCount >= int64(groupProject.Membership) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This group is full"})
		return
	}

	// 7. Logic กำหนด Leader
	isLeader := false
	if currentMemberCount == 0 {
		isLeader = true
	}

	// 8. สร้าง Object เพื่อเตรียมบันทึก
	newMember := entity.GroupMember{
		GroupProjectID: input.GroupProjectID,
		StudentID:      studentID,
		Leader:         isLeader,
	}

	// 9. บันทึกลงฐานข้อมูล
	if err := db.Create(&newMember).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Joined group successfully",
		"data":    newMember,
	})
}

// GET: ดึงข้อมูลกลุ่มของนักศึกษาที่ล็อกอินอยู่ (GetMyGroup)
func GetMyGroup(c *gin.Context) {
	// 1. ตรวจสอบสิทธิ์และดึง ID นักศึกษา
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Please log in"})
		return
	}
	studentID := claims.ID
	db := database.DB()

	// 2. ค้นหาสมาชิกในกลุ่ม (GroupMember) เพื่อหา GroupProjectID
	var member entity.GroupMember
	// ใช้ Preload เพื่อดึงข้อมูล GroupProject และ Teacher (ที่ปรึกษา)
	if err := db.Preload("GroupProject").
		Preload("GroupProject.GroupMembers.Student").
		Preload("GroupProject.Teacher"). // ดึงข้อมูลอาจารย์ที่ปรึกษา
		Where("student_id = ?", studentID).
		First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "คุณยังไม่มีกลุ่มโปรเจค"})
		return
	}

	// 3. เตรียมข้อมูลตอบกลับ
	group := member.GroupProject

	c.JSON(http.StatusOK, gin.H{
		"data": group,
	})
}
