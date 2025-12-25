package notification

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
)

// GET: /notifications/my ดึงการแจ้งเตือนของฉัน
func GetMyNotifications(c *gin.Context) {
	db := database.DB()
	
	// ดึง UserID จาก Token
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var notifications []entity.Notification
	// ดึงข้อมูล ล่าสุดขึ้นก่อน
	if err := db.Where("user_id = ?", claims.ID).Order("created_at desc").Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

// PATCH: /notifications/:id/read อ่านการแจ้งเตือนแล้ว
func MarkAsRead(c *gin.Context) {
	id := c.Param("id")
	db := database.DB()

	// อัปเดต IsRead = true
	if err := db.Model(&entity.Notification{}).Where("id = ?", id).Update("is_read", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}