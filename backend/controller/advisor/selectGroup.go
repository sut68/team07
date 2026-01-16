package advisor

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
	"gorm.io/gorm"
)

func GetAdvisorRequests(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	teacherID := claims.ID
	db := database.DB()
	finalRequests := make([]entity.SelectAdvisor, 0)

	var myGroups []entity.GroupProject
	if err := db.
		Preload("GroupMembers").
		Preload("GroupMembers.Student").
		Preload("GroupMembers.Student.Branch"). 
		Preload("GroupMembers.Student.Role").   
		Preload("GroupMembers.Student.Status"). 
		Preload("GroupMembers.Student.Gender"). 
		Where("teacher_id = ?", teacherID).
		Find(&myGroups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	descriptionMap := make(map[uint]string)

	// เก็บ ID ของกลุ่มที่เราดูแลอยู่ เพื่อเอาไป Query หา Description ทีเดียว (Optimization)
	var groupIDs []uint
	for _, g := range myGroups {
		groupIDs = append(groupIDs, g.ID)
	}

	if len(groupIDs) > 0 {
		var existingRequests []entity.SelectAdvisor
		if err := db.Select("group_project_id, description").
			Where("group_project_id IN ? AND description != ''", groupIDs).
			Order("no asc").
			Find(&existingRequests).Error; err == nil {

			for _, req := range existingRequests {
				descriptionMap[req.GroupProjectID] = req.Description
			}
		}
	}

	for _, group := range myGroups {
		currentGroup := group

		realDescription := "" // ค่า Default กรณี Admin ยัดให้
		if val, ok := descriptionMap[group.ID]; ok {
			realDescription = val
		}

		assignedItem := entity.SelectAdvisor{
			Status:         "accepted",
			GroupProjectID: group.ID,
			GroupProject:   &currentGroup,
			TeacherID:      teacherID,
			Description:    realDescription,
		}
		finalRequests = append(finalRequests, assignedItem)
	}

	var candidates []entity.SelectAdvisor
	if err := db.
		Preload("GroupProject").
		Preload("GroupProject.GroupMembers").
		Preload("GroupProject.GroupMembers.Student").
		Preload("GroupProject.GroupMembers.Student.Branch"). 
		Preload("GroupProject.GroupMembers.Student.Role").   
		Preload("GroupProject.GroupMembers.Student.Status"). 
		Preload("GroupProject.GroupMembers.Student.Gender"). 
		Where("teacher_id = ? AND status = ?", teacherID, "pending").
		Order("no asc").
		Find(&candidates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, req := range candidates {
		alreadyAccepted := false
		for _, mg := range myGroups {
			if mg.ID == req.GroupProjectID {
				alreadyAccepted = true
				break
			}
		}
		if alreadyAccepted {
			continue
		}

		var previousQueueCount int64
		db.Model(&entity.SelectAdvisor{}).
			Where("group_project_id = ? AND no < ? AND status != ?", req.GroupProjectID, req.No, "rejected").
			Count(&previousQueueCount)

		if previousQueueCount == 0 {
			finalRequests = append(finalRequests, req)
		}
	}

	var advisorStatus entity.AdvisorStatus
	// ตั้งค่า Default เป็น True ไว้ก่อน
	isOpen := true

	if err := db.Where("teacher_id = ?", teacherID).First(&advisorStatus).Error; err != nil {
		// println("⚠️ Debug: Advisor Status not found for TeacherID:", teacherID, " Error:", err.Error())
		isOpen = true
	} else {
		isOpen = advisorStatus.Status
		// println("✅ Debug: Found Status for TeacherID:", teacherID, " Status:", isOpen)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    finalRequests,
		"is_open": isOpen,
	})
}

func AcceptRequest(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	teacherID := claims.ID

	db := database.DB()

	var input struct {
		SelectionID uint `json:"selection_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	tx := db.Begin()

	var selection entity.SelectAdvisor
	if err := tx.First(&selection, input.SelectionID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	// ป้องกันการแย่งกันกด
	var group entity.GroupProject
	if err := tx.First(&group, selection.GroupProjectID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	if group.TeacherID != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "กลุ่มนี้มีอาจารย์ที่ปรึกษาไปเรียบร้อยแล้ว"})
		return
	}

	selection.Status = "accepted"
	if err := tx.Save(&selection).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update selection"})
		return
	}

	if err := tx.Model(&group).Updates(map[string]interface{}{
		"TeacherID":   teacherID,
		"GroupStatus": "Approved",
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update group advisor"})
		return
	}

	// เคลียร์ Selection ของอาจารย์ท่านอื่น
	if err := tx.Model(&entity.SelectAdvisor{}).
		Where("group_project_id = ? AND id != ?", group.ID, selection.ID).
		Update("status", "skipped").Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear other selections"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "รับกลุ่มเรียบร้อยแล้ว"})
}

func RejectRequest(c *gin.Context) {
	db := database.DB()

	var input struct {
		SelectionID uint `json:"selection_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.Model(&entity.SelectAdvisor{}).
		Where("id = ?", input.SelectionID).
		Update("status", "rejected").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject request"})
		return
	}

	log.InsertLog(c, 36)
	c.JSON(http.StatusOK, gin.H{"message": "ปฏิเสธคำขอเรียบร้อยแล้ว"})
}

func ToggleAdvisorStatus(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	teacherID := claims.ID

	db := database.DB()

	var input struct {
		IsOpen bool `json:"is_open"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var status entity.AdvisorStatus
	err = db.Where("teacher_id = ?", teacherID).First(&status).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			status = entity.AdvisorStatus{
				TeacherID: teacherID,
				Status:    input.IsOpen,
			}
			if err := db.Create(&status).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Create error: " + err.Error()})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error: " + err.Error()})
			return
		}
	} else {
		status.Status = input.IsOpen
		if err := db.Save(&status).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Update error: " + err.Error()})
			return
		}
	}

	// --- 2. Logic ตัดสิทธิ์ (Auto-Reject) เมื่อปิดรับสมัคร ---
	if !input.IsOpen {
		var pendingSelections []entity.SelectAdvisor
		if err := db.Where("teacher_id = ? AND status = ?", teacherID, "pending").
			Find(&pendingSelections).Error; err == nil {

			for _, sel := range pendingSelections {
				sel.Status = "rejected"
				db.Save(&sel)
			}
		}
	}

	log.InsertLog(c, 37)
	c.JSON(http.StatusOK, gin.H{
		"message": "Status updated successfully",
		"data":    status,
		"is_open": input.IsOpen,
	})
}
