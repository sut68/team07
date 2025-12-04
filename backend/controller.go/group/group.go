package group

import (
	"net/http"
	"strings"
	"github.com/gin-gonic/gin"

	// "github.com/sut68/team07/backend/config"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	// "gorm.io/gorm"
)

type Member struct {
        GroupProjectID uint `json:"group_project_id"`
        Leader bool `json:"leader"`
        StudentID uint`json:"student_id"`
}

func GetGroupProject(c *gin.Context) {
	db := database.DB()

	var group []entity.GroupProject
	db.Find(&group)

	c.JSON(http.StatusOK, &group)
}

func GetGroupMember(c *gin.Context) {
	db := database.DB()

	var member []entity.GroupMember
	db.Find(&member)

	c.JSON(http.StatusOK, &member)
}

func PostGroupMember(c *gin.Context) {
    db := database.DB()

    // 1. รับและ Bind ข้อมูลจาก JSON Body
    var input Member
    
    // *** เปลี่ยนมาใช้ c.ShouldBindJSON() แทน c.Query() และ strconv.Parse... ***
    if err := c.ShouldBindJSON(&input); err != nil {
        // Gin จัดการ Validation และ Type Error (เช่น ไม่ใช่ตัวเลข) อัตโนมัติ
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // 2. สร้าง Entity สำหรับ GORM
    addMember := entity.GroupMember{
        // ใช้ค่าที่ Bind มาจาก JSON
        GroupProjectID: input.GroupProjectID,
        Leader:         input.Leader,
        StudentID:      input.StudentID, 
    }

    // 3. เรียกใช้ db.Create()
    result := db.Create(&addMember)
    
    if result.Error != nil {
        // จัดการข้อผิดพลาดจากฐานข้อมูล เช่น unique constraint
        if strings.Contains(result.Error.Error(), "duplicate key value violates unique constraint") {
            // ส่ง HTTP 409 Conflict
            c.JSON(http.StatusConflict, gin.H{"error": "This student is already a member of this group."})
            return
        }
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not add group member: " + result.Error.Error()})
        return
    }

    // 4. ตอบกลับเมื่อสำเร็จ
    // GORM จะอัปเดต addMember ด้วย ID ที่ถูกสร้างขึ้น
    c.JSON(http.StatusCreated, addMember)
}