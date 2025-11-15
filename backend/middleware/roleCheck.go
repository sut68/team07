package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// RoleGuard สร้าง Middleware สำหรับตรวจสอบ Role ที่ต้องการ
// roles... คือรายชื่อ Role ที่ถูกอนุญาตให้เข้าถึง API นี้ (เช่น "Admin", "Teacher")
func RoleGuard(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. ดึง Claims ออกจาก Context (ต้องแน่ใจว่า AuthMiddleware ทำงานแล้ว)
		claims, err := GetClaimsFromContext(c)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization failed: Claims missing"})
			return
		}

		userRole := claims.Role
		
		// 2. ตรวจสอบว่า Role ของผู้ใช้ อยู่ในรายชื่อ Role ที่อนุญาตหรือไม่
		isAuthorized := false
		for _, allowedRole := range allowedRoles {
			if strings.EqualFold(userRole, allowedRole) { // ตรวจสอบแบบไม่สนใจตัวพิมพ์เล็ก/ใหญ่
				isAuthorized = true
				break
			}
		}

		// 3. ถ้าไม่อยู่ใน Role ที่อนุญาต ให้ปฏิเสธ Request
		if !isAuthorized {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error":   "Forbidden access", 
				"details": "User role (" + userRole + ") is not permitted for this resource.",
			})
			return
		}

		// 4. อนุญาตให้ไปยัง Handler ต่อไป
		c.Next()
	}
}