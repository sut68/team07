package group

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
    "github.com/sut68/team07/backend/middleware"
    "gorm.io/gorm"

)

// ใช้สำหรับรับค่าจากหน้าบ้าน (ตัด Leader ออก เพราะระบบจะคิดให้เอง)
type CreateMemberInput struct {
	GroupProjectID uint `json:"group_project_id" binding:"required"`
	// StudentID      uint `json:"student_id" binding:"required"`
}

// GET: ดึงข้อมูลกลุ่มทั้งหมด
func GetGroupProject(c *gin.Context) {
    // (Optional) ถ้าอยากให้ Login ก่อนถึงจะดูได้ ก็ใส่ Check ตรงนี้ได้เหมือนกันครับ
	db := database.DB()
	var group []entity.GroupProject
	
	// Preload เพื่อดึงข้อมูลความสัมพันธ์มาด้วย (ถ้าต้องการ)
	db.Preload("Teacher").
	   Preload("GroupMembers", func(db *gorm.DB) *gorm.DB {
			return db.Order("leader desc, id asc") // (Optional) เรียงให้ Leader อยู่บนสุดเสมอ
	   }).
	   Preload("GroupMembers.Student").
	   Find(&group)

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

    // กำหนด studentID จาก Token โดยตรง (ปลอดภัยกว่ารับจากหน้าบ้าน)
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

	// 4. เช็คว่านักศึกษาคนนี้ (จาก Token) อยู่ในกลุ่มนี้แล้วหรือยัง?
	var existingMember entity.GroupMember
	// เปลี่ยน input.StudentID เป็น studentID (ตัวแปรที่เราดึงจาก Token)
	if err := db.Where("student_id = ? AND group_project_id = ?", studentID, input.GroupProjectID).First(&existingMember).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This student is already in this group"})
		return
	}


	// 5. นับจำนวนสมาชิกปัจจุบันในกลุ่ม
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
		StudentID:      studentID, // ใช้ค่าจาก Token
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

