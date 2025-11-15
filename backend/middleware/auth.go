package middleware

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/service" // ต้อง import service เพื่อใช้ JWT Logic
)

// Auth Middleware ตรวจสอบ Access Token และสิทธิ์เข้าใช้งาน
func AuthMiddleware() gin.HandlerFunc {
	jwtService := service.NewJwtService() // สร้าง Instance ของ Service

	return func(c *gin.Context) {
		// 1. ดึง Access Token จาก Cookie
		tokenStr, err := c.Cookie("access_token")
		if err != nil {
			// ถ้าหา Cookie ไม่เจอ หรือเกิด error
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing access token in cookie"})
			return
		}

		// 2. ตรวจสอบความถูกต้องของ Token
		claims, err := jwtService.ValidateToken(tokenStr)
		if err != nil {
			// ถ้า Token ไม่ถูกต้อง, หมดอายุ, หรือปลอมแปลง
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired access token"})
			return
		}

		// 3. ฝัง Claims (ข้อมูลผู้ใช้) ลงใน Context
		// ข้อมูลนี้จะถูกใช้โดย Controller หรือ Middleware ตัวต่อไป (เช่น roleCheck)
		c.Set("claims", claims)

		// 4. ไปยัง Handler ถัดไป (หรือ Middleware ตัวต่อไป)
		c.Next()
	}
}

// Helper Function: ใช้ดึง Claims ที่ถูกฝังไว้ใน Context
func GetClaimsFromContext(c *gin.Context) (*service.Claims, error) { // service.Claims ตัวใหญ่
	cClaims, exists := c.Get("claims")
	if !exists {
		// เปลี่ยน Gin.Error และ strings.NewReader เป็น errors.New
		return nil, errors.New("claims not found in context")
	}

	// service.Claims ตัวใหญ่
	claims, ok := cClaims.(*service.Claims)
	if !ok {
		// เปลี่ยน Gin.Error และ strings.NewReader เป็น errors.New
		return nil, errors.New("invalid claims type in context")
	}

	return claims, nil
}
