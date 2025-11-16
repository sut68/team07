package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// สร้าง Middleware สำหรับตรวจสอบ Role ที่ต้องการ
func RoleGuard(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, err := GetClaimsFromContext(c)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization failed: Claims missing"})
			return
		}

		userRole := claims.Role
		
		// ตรวจสอบว่าอยู่ในรายชื่อ Role ที่อนุญาตหรือไม่
		isAuthorized := false
		for _, allowedRole := range allowedRoles {
			if strings.EqualFold(userRole, allowedRole) {
				isAuthorized = true
				break
			}
		}

		if !isAuthorized {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error":   "Forbidden access", 
				"details": "User role (" + userRole + ") is not permitted for this resource.",
			})
			return
		}

		c.Next()
	}
}