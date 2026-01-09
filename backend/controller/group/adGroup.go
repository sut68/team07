package group

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"gorm.io/gorm"
)

type GenerateGroupInput struct {
	Year   int `json:"year" binding:"required"`
	Count5 int `json:"count_5"`
	Count4 int `json:"count_4"`
	Count3 int `json:"count_3"`
}

type AddMemberInput struct {
	GroupProjectID uint `json:"group_project_id" binding:"required"`
	StudentID      uint `json:"student_id" binding:"required"`
	BypassQuota    bool `json:"bypass_quota"`
}

type RemoveMemberInput struct {
	GroupProjectID uint `json:"group_project_id" binding:"required"`
	StudentID      uint `json:"student_id" binding:"required"`
}

type ChangeLeaderInput struct {
	GroupProjectID uint `json:"group_project_id" binding:"required"`
	NewLeaderID    uint `json:"new_leader_id" binding:"required"`
}

type UpdateAdvisorInput struct {
	GroupProjectID uint  `json:"group_project_id" binding:"required"`
	TeacherID      *uint `json:"teacher_id"`
}

func GetEligibleStudentCount(c *gin.Context) {
	db := database.DB()
	var count int64

	// เงื่อนไข: Pass = false และ StatusID = 1 (Active) และ RoleID = 3 (Student)
	if err := db.Model(&entity.User{}).
		Where("pass = ? AND status_id = ? AND role_id = ?", false, 1, 3).
		Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": count})
}

func GenerateGroups(c *gin.Context) {
	db := database.DB()
	var input GenerateGroupInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var maxGroupNumber int
	// ใช้ COALESCE เพื่อจัดการกรณีที่ยังไม่มีกลุ่มในปีนั้น (ให้ค่าเป็น 0)
	row := db.Model(&entity.GroupProject{}).
		Where("year = ?", input.Year).
		Select("COALESCE(MAX(group_number), 0)").
		Row()

	if err := row.Scan(&maxGroupNumber); err != nil {
		maxGroupNumber = 0
	}

	// เริ่มต้น Transaction เพื่อความปลอดภัย
	tx := db.Begin()

	currentGroupNum := maxGroupNumber + 1

	createGroups := func(amount int, size int) error {
		for i := 0; i < amount; i++ {
			group := entity.GroupProject{
				GroupNumber: uint(currentGroupNum),
				Year:        input.Year,
				GroupStatus: "Pending",
				Membership:  size,
			}
			if err := tx.Create(&group).Error; err != nil {
				return err
			}
			currentGroupNum++
		}
		return nil
	}

	if err := createGroups(input.Count5, 5); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create groups (Size 5)"})
		return
	}

	if err := createGroups(input.Count4, 4); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create groups (Size 4)"})
		return
	}

	if err := createGroups(input.Count3, 3); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create groups (Size 3)"})
		return
	}

	tx.Commit()

	log.InsertLog(c, 38)
	c.JSON(http.StatusCreated, gin.H{
		"message":           "Groups generated successfully",
		"year":              input.Year,
		"last_group_number": currentGroupNum - 1,
	})
}

func GetGroupDetailById(c *gin.Context) {
	db := database.DB()
	id := c.Param("id")
	var group entity.GroupProject

	if err := db.Preload("GroupMembers", func(db *gorm.DB) *gorm.DB {
		return db.Order("group_members.id ASC") // เรียงตาม ID
	}).Preload("GroupMembers.Student").Preload("Teacher").First(&group, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": group})
}

func SearchAvailableStudents(c *gin.Context) {
	db := database.DB()
	yearStr := c.Query("year")

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Year is required"})
		return
	}

	var students []entity.User

	subQuery := db.Model(&entity.GroupMember{}). // ใช้ Model เพื่อให้ GORM กรอง Soft Delete
							Select("group_members.student_id").
							Joins("JOIN group_projects ON group_members.group_project_id = group_projects.id").
							Where("group_projects.year = ?", year)

	// Query หลักดึงรายชื่อนักศึกษา
	if err := db.Model(&entity.User{}).
		Where("role_id = ?", 3).          // เป็นนักศึกษา
		Where("pass = ?", false).         // ยังไม่ผ่าน
		Where("status_id = ?", 1).        // สถานะ Active
		Where("id NOT IN (?)", subQuery). // ไม่อยู่ในรายชื่อคนที่มีกลุ่ม (Subquery)
		Order("username asc").
		Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": students})
}

func AddMemberToGroup(c *gin.Context) {
	db := database.DB()
	var input AddMemberInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var group entity.GroupProject
	if err := db.Preload("GroupMembers").First(&group, input.GroupProjectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	var count int64
	err := db.Table("group_members").
		Joins("JOIN group_projects ON group_members.group_project_id = group_projects.id").
		Where("group_members.student_id = ? AND group_projects.year = ? AND group_members.deleted_at IS NULL", input.StudentID, group.Year).
		Count(&count).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error checking existing group"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "DUPLICATE_YEAR_GROUP",
			"message": "นักศึกษาคนนี้มีกลุ่มในปีการศึกษานี้แล้ว",
		})
		return
	}

	activeMembersCount := 0
	for _, m := range group.GroupMembers {
		if m.DeletedAt.Time.IsZero() { // เช็คว่ายังไม่ถูกลบ
			activeMembersCount++
		}
	}

	if activeMembersCount >= group.Membership {
		if !input.BypassQuota {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "OVER_QUOTA",
				"message": "Group is full.",
			})
			return
		}
	}

	// ตรวจสอบว่าเคยเป็นสมาชิกกลุ่มนี้แล้วถูกลบไปหรือไม่? (Soft Delete check)
	var existingDeletedMember entity.GroupMember

	// ใช้ Unscoped() เพื่อค้นหาข้อมูลที่ถูกลบไปแล้ว
	checkErr := db.Unscoped().
		Where("group_project_id = ? AND student_id = ?", input.GroupProjectID, input.StudentID).
		First(&existingDeletedMember).Error

	if checkErr == nil {
		if !existingDeletedMember.DeletedAt.Time.IsZero() {
			// กรณี: เคยอยู่ -> ถูกลบ -> เพิ่มใหม่
			// ให้ทำการ "กู้คืน" (Restore) โดยปรับ deleted_at เป็น NULL
			if err := db.Model(&existingDeletedMember).Unscoped().Updates(map[string]interface{}{
				"deleted_at": nil,
				"leader":     false,
			}).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to restore member"})
				return
			}

			c.JSON(http.StatusOK, gin.H{"message": "Member restored successfully"})
			return
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "User already in this group"})
			return
		}
	}
	newMember := entity.GroupMember{
		GroupProjectID: input.GroupProjectID,
		StudentID:      input.StudentID,
		Leader:         false,
	}

	if err := db.Create(&newMember).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add member"})
		return
	}
log.InsertLog(c, 39)
	
	c.JSON(http.StatusOK, gin.H{"message": "Member added successfully"})
}

func RemoveMemberFromGroup(c *gin.Context) {
	db := database.DB()
	var input RemoveMemberInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var member entity.GroupMember
	if err := db.Where("group_project_id = ? AND student_id = ?", input.GroupProjectID, input.StudentID).
		First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Member not found in this group"})
		return
	}

	if member.Leader {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "CANNOT_REMOVE_LEADER",
			"message": "Cannot remove the leader. Please promote a new leader first.",
		})
		return
	}

	if err := db.Delete(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove member"})
		return
	}
	log.InsertLog(c, 40)
	c.JSON(http.StatusOK, gin.H{"message": "Member removed successfully"})
}

func ChangeLeader(c *gin.Context) {
	db := database.DB()
	var input ChangeLeaderInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := db.Transaction(func(tx *gorm.DB) error {
		// ปลดหัวหน้าทุกคนในกลุ่มนี้ (Set Leader = false)
		if err := tx.Model(&entity.GroupMember{}).
			Where("group_project_id = ?", input.GroupProjectID).
			Update("leader", false).Error; err != nil {
			return err
		}

		// ตั้งคนใหม่เป็นหัวหน้า (Set Leader = true)
		result := tx.Model(&entity.GroupMember{}).
			Where("group_project_id = ? AND student_id = ?", input.GroupProjectID, input.NewLeaderID).
			Update("leader", true)

		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound // ไม่พบนักศึกษาคนนี้ในกลุ่ม
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to change leader", "details": err.Error()})
		return
	}
	log.InsertLog(c, 41)
	
	c.JSON(http.StatusOK, gin.H{"message": "Leader changed successfully"})
}

func DeleteGroup(c *gin.Context) {
	db := database.DB()
	id := c.Param("id")

	err := db.Transaction(func(tx *gorm.DB) error {
		// ลบสมาชิกทั้งหมด
		if err := tx.Where("group_project_id = ?", id).Delete(&entity.GroupMember{}).Error; err != nil {
			return err
		}

		// ลบตัวกลุ่ม
		if err := tx.Delete(&entity.GroupProject{}, id).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete group"})
		return
	}
	log.InsertLog(c, 42)
	c.JSON(http.StatusOK, gin.H{"message": "Group deleted successfully"})
}

func GetAllTeachers(c *gin.Context) {
	db := database.DB()
	var teachers []entity.User

	if err := db.Where("role_id = ? AND status_id = ?", 2, 1).Find(&teachers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": teachers})
}

// อัปเดตอาจารย์ที่ปรึกษาประจำกลุ่ม
func UpdateGroupAdvisor(c *gin.Context) {
	db := database.DB()
	var input UpdateAdvisorInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ค้นหากลุ่ม
	var group entity.GroupProject
	if err := db.First(&group, input.GroupProjectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	if err := db.Model(&group).Select("TeacherID").Updates(map[string]interface{}{
		"TeacherID": input.TeacherID,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update advisor"})
		return
	}
	log.InsertLog(c, 43)
	
	c.JSON(http.StatusOK, gin.H{"message": "Advisor updated successfully"})
}

