package advisor

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
)

type SelectAdvisorPayload struct {
	GroupProjectID uint   `json:"group_project_id" binding:"required"`
	Description    string `json:"description" binding:"required"`
	AdvisorOrder   []uint `json:"advisor_order" binding:"required"`
}

// GET: /advisor/teachers
func GetAllTeachers(c *gin.Context) {
	db := database.DB()
	var teachers []entity.User

	// เลือกเฉพาะ RoleID = 2 (Teacher) และเลือกเฉพาะ field ที่จำเป็น
	if err := db.Select("id, firstname, lastname, username").Where("role_id = ?", 2).Find(&teachers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": teachers})
}

// POST: /advisor/select
// บันทึกการเลือกอาจารย์ที่ปรึกษา
func SaveAdvisorSelection(c *gin.Context) {
	// 1. ตรวจสอบสิทธิ์ (ต้อง Login)
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	studentID := claims.ID

	// 2. รับค่า Payload
	var payload SelectAdvisorPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.DB()

	// 3. ตรวจสอบว่าผู้ใช้เป็นหัวหน้ากลุ่มของ GroupProjectID นี้จริงหรือไม่
	var member entity.GroupMember
	if err := db.Where("group_project_id = ? AND student_id = ? AND leader = ?", payload.GroupProjectID, studentID, true).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "คุณไม่มีสิทธิ์บันทึกข้อมูล (ต้องเป็นหัวหน้ากลุ่มเท่านั้น)"})
		return
	}

	// 4. เริ่ม Transaction
	tx := db.Begin()

	// 4.1 ลบข้อมูลการเลือกเดิมของกลุ่มนี้ออกก่อน (ถ้ามี) เพื่อบันทึกใหม่
	if err := tx.Where("group_project_id = ?", payload.GroupProjectID).Delete(&entity.SelectAdvisor{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear old selection"})
		return
	}

	// 4.2 วนลูปบันทึกข้อมูลตามลำดับ
	for i, teacherID := range payload.AdvisorOrder {
		selection := entity.SelectAdvisor{
			No:             uint(i + 1), 
			Description:    payload.Description,
			GroupProjectID: payload.GroupProjectID,
			TeacherID:      teacherID,
		}

		if err := tx.Create(&selection).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save selection"})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusCreated, gin.H{"message": "Advisor selection saved successfully"})
}

// GET: /advisor/selection/:groupId
// ดึงข้อมูลการเลือกอาจารย์ของกลุ่ม (เพื่อนำมาแสดงผลหรือแก้ไข)
func GetAdvisorSelection(c *gin.Context) {
	groupID := c.Param("groupId")
	db := database.DB()
	var selections []entity.SelectAdvisor

	if err := db.Preload("Teacher").Where("group_project_id = ?", groupID).Order("no asc").Find(&selections).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": selections})
}
