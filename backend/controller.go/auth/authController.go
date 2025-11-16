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

type LoginHandler struct {
	DB         *gorm.DB
	JwtService service.JwtService
}

func NewLoginHandler() *LoginHandler {
	return &LoginHandler{
		DB:         database.DB(),
		JwtService: service.NewJwtService(),
	}
}

type LoginInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	Message  string `json:"message"`
}

type RefreshResponse struct {
	CSRFToken string `json:"csrf_token"`
	Message   string `json:"message"`
}

func (h *LoginHandler) Me(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization failed: Claims missing"})
		return
	}

	//Response ข้อมูลผู้ใช้
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

    var user entity.User
    if err := h.DB.Preload("Role").Where("username = ?", input.Username).First(&user).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found or credentials invalid"})
            return
        }
        log.Printf("DB error finding user: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
        return
    }

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

    //สร้าง CSRF Token
    csrfToken := h.JwtService.HashTokenSHA256(accessToken) 

    // 5. บันทึก Refresh Token Hash ลง DB
    if err := h.JwtService.SaveRefreshToken(h.DB, refreshToken, user.ID); err != nil {
        log.Printf("Error saving refresh token to DB: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not process login"})
        return
    }

    setAuthCookies(c, accessToken, refreshToken, csrfToken)

    c.JSON(http.StatusOK, LoginResponse{
        ID:       user.ID,
        Username: user.Username,
        Role:     user.Role.Role,
        Message:  "Login successfully",
    })
}

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

	// 3.ตรวจสอบ Token Replay Attack และลบ Token เก่าใน DB
	if err := h.JwtService.CheckAndRevokeRefreshToken(h.DB, refreshToken, claims.ID); err != nil {
		clearAuthCookies(c)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or revoked session. Please log in again."})
		return
	}

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

	// 6. สร้าง CSRF Token ใหม่
	csrfToken := h.JwtService.HashTokenSHA256(newAccessToken) // ใช้ Hash ของ Access Token เป็น CSRF Token

	// 7. บันทึก Refresh Token ใหม่ลง DB
	if err := h.JwtService.SaveRefreshToken(h.DB, newRefreshToken, user.ID); err != nil {
		log.Printf("Error saving new refresh token to DB: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not process refresh"})
		return
	}

	// 8. ตั้งค่า Cookie ที่เป็น Non-HttpOnly)
	setAuthCookies(c, newAccessToken, newRefreshToken, csrfToken)

	c.JSON(http.StatusOK, RefreshResponse{
		CSRFToken: csrfToken,
		Message:   "Tokens refreshed successfully",
	})
}

// Logout Handles POST /logout
func (h *LoginHandler) Logout(c *gin.Context) {
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		clearAuthCookies(c)
		c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully (session was already cleared)"})
		return
	}

	// ลบ Refresh Token ทั้งหมดของ User นี้ออกจาก DB (เพิกถอน Session)
	if err := h.DB.Where("user_id = ?", claims.ID).Delete(&entity.RefreshToken{}).Error; err != nil {
		log.Printf("Error deleting refresh tokens for user %d: %v", claims.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not process logout completely"})
		return
	}

	// Clear Cookies ทั้งหมด
	clearAuthCookies(c)

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func setAuthCookies(c *gin.Context, accessToken, refreshToken, csrfToken string) {
	cookieDomain := config.CookieDomain()
	isProd := config.IsProduction()

	// Access Token (HTTP-Only)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		Domain:   cookieDomain,
		MaxAge:   int(config.AccessTokenTTL().Seconds()),
		Secure:   isProd,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	// Refresh Token (HTTP-Only)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/refresh",
		Domain:   cookieDomain,
		MaxAge:   int(config.RefreshTokenTTL().Seconds()),
		Secure:   isProd,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	//CSRF Token (Non-HttpOnly)  เพื่อให้ Frontend  อ่านค่าได้
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "csrf_token",
		Value:    csrfToken,
		Path:     "/",
		Domain:   cookieDomain,
		MaxAge:   int(config.RefreshTokenTTL().Seconds()),
		Secure:   isProd,
		HttpOnly: false,
		SameSite: http.SameSiteLaxMode,
	})
}

// clearAuthCookies
func clearAuthCookies(c *gin.Context) {
	cookieDomain := config.CookieDomain()
	isProd := config.IsProduction()

	// ลบ Access Token
	http.SetCookie(c.Writer, &http.Cookie{Name: "access_token", Value: "", Path: "/", Domain: cookieDomain, MaxAge: -1, Secure: isProd, HttpOnly: true, SameSite: http.SameSiteLaxMode})
	// ลบ Refresh Token
	http.SetCookie(c.Writer, &http.Cookie{Name: "refresh_token", Value: "", Path: "/refresh", Domain: cookieDomain, MaxAge: -1, Secure: isProd, HttpOnly: true, SameSite: http.SameSiteLaxMode})
	// ลบ CSRF Token
	http.SetCookie(c.Writer, &http.Cookie{Name: "csrf_token", Value: "", Path: "/", Domain: cookieDomain, MaxAge: -1, Secure: isProd, HttpOnly: false, SameSite: http.SameSiteLaxMode})
}
