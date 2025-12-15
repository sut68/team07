package issues

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
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
	// สมมติให้ StatusID = 1 คือ "รอการแก้ไข" หรือ "Pending" (ขึ้นอยู่กับ Mock Data ของคุณ)
	issue := entity.IssueReport{
		Detail:     input.Detail,
		ReportDate: time.Now(), // ใช้วันเวลาปัจจุบัน
		StatusID:   1,          // Default Status (เช่น 1 = Pending)
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

func GetIssueStatus(c *gin.Context) {
	db := database.DB()
	var issueStatus []entity.IssueStatus

	db.Find(&issueStatus)

	c.JSON(http.StatusOK, &issueStatus)
}
