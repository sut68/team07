package auth

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/config"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
	"github.com/sut68/team07/backend/service"
	"gorm.io/gorm"
)

// LoginHandler
type LoginHandler struct {
	DB         *gorm.DB
	JwtService service.JwtService
}

// NewLoginHandler สร้าง Controller พร้อม Dependency Injection
func NewLoginHandler() *LoginHandler {
	return &LoginHandler{
		DB:         database.DB(),
		JwtService: service.NewJwtService(),
	}
}

// Struct สำหรับรับ Input จาก Body
type LoginInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Struct สำหรับ Response
type LoginResponse struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	Message  string `json:"message"`
}

// Me Handles GET /me
func (h *LoginHandler) Me(c *gin.Context) {
	// 1. ดึง Claims จาก Context (ต้องผ่าน AuthMiddleware)
	// GetClaimsFromContext เป็น Helper ที่เราสร้างไว้ใน middleware/auth.go
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		// หากเข้าถึงตรงนี้ได้แสดงว่า AuthMiddleware ทำงานผิดพลาด หรือ Claims ถูกลบ
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization failed: Claims missing"})
		return
	}

	// 2. Response ข้อมูลผู้ใช้
	// เราใช้ข้อมูลจาก Claims โดยตรง ซึ่งเร็วกว่าการ Query DB
	c.JSON(http.StatusOK, gin.H{
		"id":       claims.ID,
		"username": claims.Username,
		"role":     claims.Role,
		"message":  "User data retrieved successfully",
	})
}

// Login Handles POST /login
func (h *LoginHandler) Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input format"})
		return
	}

	// 1. ดึง User จาก DB
	var user entity.User
	// ใช้ Preload เพื่อดึง Role มาพร้อมกัน เพื่อให้เข้าถึง user.Role.Role ได้ทันที
	if err := h.DB.Preload("Role").Where("username = ?", input.Username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found or credentials invalid"})
			return
		}
		log.Printf("DB error finding user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	// 2. ตรวจสอบ Password Hash
	if !h.JwtService.CheckPasswordHash(input.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found or credentials invalid"})
		return
	}

	// 3. สร้าง Access Token และ Refresh Token
	accessToken, err := h.JwtService.GenerateToken(&user, config.AccessTokenTTL())
	if err != nil {
		log.Printf("Error generating access token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not issue access token"})
		return
	}

	refreshToken, err := h.JwtService.GenerateToken(&user, config.RefreshTokenTTL())
	if err != nil {
		log.Printf("Error generating refresh token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not issue refresh token"})
		return
	}

	// 4. บันทึก Refresh Token Hash ลง DB เพื่อรองรับ Token Rotation
	if err := h.JwtService.SaveRefreshToken(h.DB, refreshToken, user.ID); err != nil {
		log.Printf("Error saving refresh token to DB: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not process login"})
		return
	}

	// 5. ตั้งค่า Cookie (Access Token และ Refresh Token)
	setAuthCookies(c, accessToken, refreshToken)

	// 6. Response สำเร็จ
	c.JSON(http.StatusOK, LoginResponse{
		ID:       user.ID,
		Username: user.Username,
		Role:     user.Role.Role,
		Message:  "Login successfully",
	})
}

// Refresh Handles POST /refresh
func (h *LoginHandler) Refresh(c *gin.Context) {
	// 1. ดึง Refresh Token จาก Cookie
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing refresh token"})
		return
	}

	// 2. Validate Refresh Token เพื่อดึง Claims
	claims, err := h.JwtService.ValidateToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
		return
	}

	// 3. ตรวจสอบ Token Replay Attack และลบ Token เก่าใน DB
	// CheckAndRevokeRefreshToken จะจัดการ:
	// a. ตรวจสอบ Token Hash ใน DB
	// b. ลบ Token เก่า (Rotation)
	// c. **สำคัญ:** ถ้าพบ Token ที่ถูกลบไปแล้ว (Replay) จะเพิกถอน Token ใหม่ใน Family
	if err := h.JwtService.CheckAndRevokeRefreshToken(h.DB, refreshToken, claims.ID); err != nil {
		// หากมีการโจมตี หรือ Token หมดอายุจาก DB/ถูกลบ
		// เรา Clear Cookie เพื่อบังคับ Login ใหม่เพื่อความปลอดภัย
		clearAuthCookies(c)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or revoked session. Please log in again."})
		return
	}

	// 4. ดึง User ล่าสุด (กรณี Role/ข้อมูลเปลี่ยน)
	var user entity.User
	if err := h.DB.Preload("Role").First(&user, claims.ID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User data not found"})
		return
	}

	// 5. สร้าง Access Token และ Refresh Token ใหม่
	newAccessToken, err := h.JwtService.GenerateToken(&user, config.AccessTokenTTL())
	if err != nil {
		log.Printf("Error generating new access token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not issue new access token"})
		return
	}
	newRefreshToken, err := h.JwtService.GenerateToken(&user, config.RefreshTokenTTL())
	if err != nil {
		log.Printf("Error generating new refresh token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not issue new refresh token"})
		return
	}

	// 6. บันทึก Refresh Token ใหม่ลง DB (Token Rotation)
	if err := h.JwtService.SaveRefreshToken(h.DB, newRefreshToken, user.ID); err != nil {
		log.Printf("Error saving new refresh token to DB: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not process refresh"})
		return
	}

	// 7. ตั้งค่า Cookie ใหม่
	setAuthCookies(c, newAccessToken, newRefreshToken)

	c.JSON(http.StatusOK, gin.H{"message": "Tokens refreshed successfully"})
}

// Logout Handles POST /logout
func (h *LoginHandler) Logout(c *gin.Context) {
	// 1. ดึง Claims จาก Context (ต้องผ่าน AuthMiddleware)
	claims, err := middleware.GetClaimsFromContext(c) // <--- แก้ไขตรงนี้
	if err != nil {
		// ถ้าไม่มี Claims ใน Context (แสดงว่าไม่ได้ Login) ก็แค่ Clear Cookies
		clearAuthCookies(c)
		c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully (session was already cleared)"})
		return
	}

	// 2. ลบ Refresh Token ทั้งหมดของ User นี้ออกจาก DB (เพิกถอน Session)
	// การมี Refresh Token หลายตัวอาจเป็นไปได้หากใช้หลาย Device
	if err := h.DB.Where("user_id = ?", claims.ID).Delete(&entity.RefreshToken{}).Error; err != nil {
		log.Printf("Error deleting refresh tokens for user %d: %v", claims.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not process logout completely"})
		return
	}

	// 3. Clear Cookies ทั้งหมด
	clearAuthCookies(c)

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// setAuthCookies ตั้งค่า Access และ Refresh Token ลงใน HTTP-Only Cookie
func setAuthCookies(c *gin.Context, accessToken, refreshToken string) {
	cookieDomain := config.CookieDomain()
	isProd := config.IsProduction()

	// Access Token (อายุสั้น)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		Domain:   cookieDomain,
		MaxAge:   int(config.AccessTokenTTL().Seconds()),
		Secure:   isProd, // ใช้ Secure: true เมื่ออยู่ Production/HTTPS
		HttpOnly: true,   // ป้องกัน XSS
		SameSite: http.SameSiteLaxMode,
	})

	// Refresh Token (อายุยาว)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/refresh", // ใช้ Path ที่แคบกว่าเพื่อจำกัดการส่ง (Security)
		Domain:   cookieDomain,
		MaxAge:   int(config.RefreshTokenTTL().Seconds()),
		Secure:   isProd,
		HttpOnly: true,                 // ป้องกัน XSS
		SameSite: http.SameSiteLaxMode, // ใช้ Lax Mode เป็นค่า Default ที่แนะนำ
	})
}

// clearAuthCookies ลบคุกกี้โดยการกำหนด MaxAge เป็น -1
func clearAuthCookies(c *gin.Context) {
	cookieDomain := config.CookieDomain()
	isProd := config.IsProduction()

	// ลบ Access Token
	http.SetCookie(c.Writer, &http.Cookie{Name: "access_token", Value: "", Path: "/", Domain: cookieDomain, MaxAge: -1, Secure: isProd, HttpOnly: true, SameSite: http.SameSiteLaxMode})
	// ลบ Refresh Token
	http.SetCookie(c.Writer, &http.Cookie{Name: "refresh_token", Value: "", Path: "/refresh", Domain: cookieDomain, MaxAge: -1, Secure: isProd, HttpOnly: true, SameSite: http.SameSiteLaxMode})
}
