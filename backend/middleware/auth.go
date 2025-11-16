package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/service"
)

// Auth Middleware ตรวจสอบ Access Token และสิทธิ์เข้าใช้งาน
func AuthMiddleware() gin.HandlerFunc {
	jwtService := service.NewJwtService()

	return func(c *gin.Context) {
		// ดึง Access Token จาก Cookie
		tokenStr, err := c.Cookie("access_token")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing access token in cookie"})
			return
		}

		// ตรวจสอบความถูกต้องของ Token
		claims, err := jwtService.ValidateToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired access token"})
			return
		}
		// ฝัง Claims ลงใน Context เพื่อให้ Handler ตัวถัดไปใช้งานได้
		c.Set("claims", claims)

		c.Next()
	}
}

// ใช้ดึง Claims ที่ถูกฝังไว้ใน Context
func GetClaimsFromContext(c *gin.Context) (*service.Claims, error) {
	cClaims, exists := c.Get("claims")
	if !exists {
		return nil, errors.New("claims not found in context")
	}

	claims, ok := cClaims.(*service.Claims)
	if !ok {
		return nil, errors.New("invalid claims type in context")
	}

	return claims, nil
}

func CSRFCheckMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		//ตรวจสอบเมธอด: ต้องเป็น POST, PUT, PATCH, DELETE เท่านั้น
		method := strings.ToUpper(c.Request.Method)
		if method == "GET" || method == "HEAD" || method == "OPTIONS" {
			c.Next()
			return
		}
		//ดึง Token จาก Header ที่ Frontend ส่งมา
		headerToken := c.Request.Header.Get("X-CSRF-Token")
		if headerToken == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF token missing in header"})
			return
		}

		// ดึง Token จาก Cookie ที่ Backend สร้าง
		cookieToken, err := c.Cookie("csrf_token")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF token missing in cookie"})
			return
		}

		//เปรียบเทียบ Token ทั้งสอง
		if headerToken != cookieToken {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF token mismatch"})
			return
		}
		
		c.Next()
	}
}
