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

	// 2. รับค่า year จากหน้าบ้าน (เช่น ?year=2567)
	year := c.Query("year")

	// 3. ถ้ามีการส่ง year มา ให้เพิ่มเงื่อนไข WHERE
	if year != "" {
		query = query.Where("year = ?", year)
	}

	// 4. สั่งค้นหา
	if err := query.Find(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, &group)
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

	// กำหนด studentID จาก Token โดยตรง
	studentID := claims.ID

	db := database.DB()

	// 2. รับค่า Input (เหลือแค่ Group ID)
	var input CreateMemberInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3. ตรวจสอบว่ากลุ่มที่จะเข้า มีอยู่จริงหรือไม่?
	var groupProject entity.GroupProject
	if err := db.First(&groupProject, input.GroupProjectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project group not found"})
		return
	}

	// --- 4. (แก้ไขใหม่) เช็คว่านักศึกษาคนนี้ มีกลุ่มอยู่แล้วหรือยัง (ไม่สนว่ากลุ่มไหน) ---
	var existingMember entity.GroupMember

	// เราเช็คแค่ student_id อย่างเดียว ถ้าเจอ record แปลว่าเขามีสังกัดแล้ว
	if err := db.Where("student_id = ?", studentID).First(&existingMember).Error; err == nil {
		// ถ้า err == nil แสดงว่า "เจอข้อมูล" -> ห้ามเข้ากลุ่มเพิ่ม
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already have a group. Cannot join another group."})
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

	// 7. Logic กำหนด Leader: ถ้าสมาชิกปัจจุบันเป็น 0 แสดงว่าคนนี้คือคนแรก
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
