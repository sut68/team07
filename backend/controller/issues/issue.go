package issues

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
)

// CreateIssueInput ใช้สำหรับรับค่าจากหน้าบ้าน
// ไม่ต้องรับ StatusID เพราะตอนสร้างควรเป็นค่าเริ่มต้น (เช่น Pending)
// ไม่ต้องรับ ReportDate เพราะควรใช้วันเวลาปัจจุบัน (time.Now)
type CreateIssueInput struct {
	Detail string `json:"detail" binding:"required"`
	TypeID uint   `json:"type_id" binding:"required"`
	UserID uint   `json:"user_id" binding:"required"` // กรณีรับจาก json (ถ้าใช้ jwt อาจดึงจาก token แทน)
}

// POST: สร้างรายงานปัญหา (Create Issue)
func CreateIssue(c *gin.Context) {
	db := database.DB()

	// 1. รับค่า Input
	var input CreateIssueInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2. ค้นหาว่า User มีอยู่จริงไหม (Optional: เพื่อความชัวร์)
	var user entity.User
	if err := db.First(&user, input.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// 3. ค้นหาว่า IssueType มีอยู่จริงไหม (Optional)
	var issueType entity.IssueType
	if err := db.First(&issueType, input.TypeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Issue Type not found"})
		return
	}

	// 4. สร้าง Object IssueReport
	issue := entity.IssueReport{
		Detail:     input.Detail,
		ReportDate: time.Now(), // ใช้วันเวลาปัจจุบัน
		StatusID:   3,          // Default Status 3 = Pending
		TypeID:     input.TypeID,
		UserID:     input.UserID,
	}

	// 5. บันทึกลงฐานข้อมูล
	if err := db.Create(&issue).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 6. ส่งผลลัพธ์กลับ
	c.JSON(http.StatusCreated, gin.H{
		"message": "Issue reported successfully",
		"data":    issue,
	})
}

// GET: ดึงข้อมูลรายการแจ้งปัญหาทั้งหมด (List Issues)
func GetIssueReports(c *gin.Context) {
	db := database.DB()
	var issues []entity.IssueReport

	// Preload ข้อมูลที่เกี่ยวข้อง: User, Status, Type
	// Preload("User") จะทำให้เราเห็นว่าใครเป็นคนแจ้ง
	// Preload("Status") จะทำให้เห็นสถานะเป็น text (เช่น Completed)
	// Preload("Type") จะทำให้เห็นประเภทเป็น text (เช่น Bug, Feature)
	if err := db.Preload("User").Preload("Status").Preload("Type").Find(&issues).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, issues)
}

// GET: ดึงข้อมูลรายการแจ้งปัญหาตาม ID (Get Issue By ID)
func GetIssueReportByID(c *gin.Context) {
	db := database.DB()
	var issue entity.IssueReport
	id := c.Param("id")

	if err := db.Preload("User").Preload("Status").Preload("Type").First(&issue, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Issue report not found"})
		return
	}

	c.JSON(http.StatusOK, issue)
}

// GET: /issues/my ดึงรายการแจ้งปัญหา "เฉพาะของตัวเอง"
func GetMyIssues(c *gin.Context) {
	db := database.DB()
	var issues []entity.IssueReport

	// 1. ดึง UserID จาก Token (ที่ Login เข้ามา)
	// สมมติว่า middleware คุณเก็บ userId ไว้ใน key "userId" หรือดึงผ่าน Helper
	// ถ้าใช้ pattern เดียวกับ GetUserProfile ก่อนหน้านี้:
	// (ต้อง import middleware ด้วยนะครับ)
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Invalid Token"})
		return
	}
	userId := claims.ID // ดึง ID จาก Claims

	// ค้นหา Issue โดยใส่เงื่อนไข WHERE user_id = ?
	if err := db.Preload("User").Preload("Status").Preload("Type").
		Where("user_id = ?", userId). // ใช้ userId ที่ได้จาก Token
		Find(&issues).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, issues)
}

// struct สำหรับรับค่า status_id
type UpdateIssueStatusInput struct {
	StatusID uint `json:"status_id" binding:"required"`
}

// PATCH: อัปเดตสถานะรายการแจ้งปัญหา
func UpdateIssueStatus(c *gin.Context) {
	db := database.DB()
	id := c.Param("id")

	// 1. รับค่า StatusID ใหม่
	var input UpdateIssueStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2. ค้นหา Issue ที่จะอัปเดต
	var issue entity.IssueReport
	if err := db.First(&issue, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Issue not found"})
		return
	}

	// 3. ตรวจสอบว่า StatusID มีอยู่จริงไหม (กันใส่เลขมั่ว)
	var status entity.IssueStatus
	if err := db.First(&status, input.StatusID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Status not found"})
		return
	}

	// 4. อัปเดตสถานะ
	if err := db.Model(&issue).Update("status_id", input.StatusID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully", "data": issue})
}

func GetIssueStatus(c *gin.Context) {
	db := database.DB()
	var issueStatus []entity.IssueStatus

	db.Find(&issueStatus)

	c.JSON(http.StatusOK, &issueStatus)
}
