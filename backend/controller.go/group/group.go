package group

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
)

// ใช้สำหรับรับค่าจากหน้าบ้าน (ตัด Leader ออก เพราะระบบจะคิดให้เอง)
type CreateMemberInput struct {
	GroupProjectID uint `json:"group_project_id" binding:"required"`
	StudentID      uint `json:"student_id" binding:"required"`
}

// GET: ดึงข้อมูลกลุ่มทั้งหมด
func GetGroupProject(c *gin.Context) {
	db := database.DB()
	var group []entity.GroupProject
	
	// Preload เพื่อดึงข้อมูลความสัมพันธ์มาด้วย (ถ้าต้องการ)
	db.Preload("Teacher").Find(&group)

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
	db := database.DB()

	// 1. รับค่า Input
	var input CreateMemberInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2. ตรวจสอบว่ากลุ่มที่จะเข้า มีอยู่จริงหรือไม่? และดึงค่า Max Membership มา
	var groupProject entity.GroupProject
	if err := db.First(&groupProject, input.GroupProjectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project group not found"})
		return
	}

	// 3. เช็คว่านักศึกษาคนนี้ อยู่ในกลุ่มนี้แล้วหรือยัง? (กันข้อมูลซ้ำ)
	var existingMember entity.GroupMember
	if err := db.Where("student_id = ? AND group_project_id = ?", input.StudentID, input.GroupProjectID).First(&existingMember).Error; err == nil {
		// ถ้าหาเจอ (err == nil) แสดงว่าอยู่แล้ว
		c.JSON(http.StatusBadRequest, gin.H{"error": "This student is already in this group"})
		return
	}

	// 4. นับจำนวนสมาชิกปัจจุบันในกลุ่ม
	var currentMemberCount int64
	db.Model(&entity.GroupMember{}).Where("group_project_id = ?", input.GroupProjectID).Count(&currentMemberCount)

	// 5. เช็คว่ากลุ่มเต็มหรือยัง?
	if currentMemberCount >= int64(groupProject.Membership) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This group is full"})
		return
	}

	// 6. Logic กำหนด Leader: ถ้าสมาชิกปัจจุบันเป็น 0 แสดงว่าคนนี้คือคนแรก
	isLeader := false
	if currentMemberCount == 0 {
		isLeader = true
	}

	// 7. สร้าง Object เพื่อเตรียมบันทึก
	newMember := entity.GroupMember{
		GroupProjectID: input.GroupProjectID,
		StudentID:      input.StudentID,
		Leader:         isLeader, // ค่าที่เราคำนวณไว้
	}

	// 8. บันทึกลงฐานข้อมูล
	if err := db.Create(&newMember).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 9. ส่งผลลัพธ์กลับ
	c.JSON(http.StatusCreated, gin.H{
		"message": "Joined group successfully",
		"data":    newMember,
	})
}