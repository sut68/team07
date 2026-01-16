package auth

import (
	"fmt"
	logSys "log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/config"
	"github.com/sut68/team07/backend/controller/log"
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

// --- UPDATED STRUCT: Added the Trap Field ---
type LoginInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	// This is the Honeypot. Humans send "", Bots send text.
	IsPeople string `json:"ispeople"` 
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

type ForgotPasswordInput struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
}

type ResetPasswordInput struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

type ChangePasswordInput struct {
	Email           string `json:"email" binding:"required,email"`
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
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

	// --- HONEYPOT TRAP ---
	// Logic: If 'ispeople' contains ANY text, it is a bot.
	if input.IsPeople != "" {
		// Log it internally so you know it worked
		fmt.Printf("[SECURITY] Bot detected via Login Honeypot! Payload: %s\n", input.IsPeople)

		// FAKE FAIL: Return 500 Internal Server Error.
		// The bot thinks the server is broken/down and might stop trying.
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error: Login processing failed"})
		return
	}

	normalizedUsername := service.NormalizeUsername(input.Username)

	var user entity.User

	// ใช้ normalizedUsername ในการค้นหา DB
	if err := h.DB.Preload("Role").Preload("Status").Where("username = ?", normalizedUsername).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Username or Password invalid"})
			return
		}
		logSys.Printf("DB ERROR: Failed to query user for login: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error during login"})
		return
	}

	if user.Status == nil || user.Status.Status != "Active" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is not active"})
		return
	}

	if !h.JwtService.CheckPasswordHash(input.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username or Password invalid"})
		return
	}

	// 1. สร้าง Access Token และ Refresh Token
	accessToken, err := h.JwtService.GenerateToken(&user, config.AccessTokenTTL())
	if err != nil {
		logSys.Printf("Error generating access token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not issue access token"})
		return
	}

	refreshToken, err := h.JwtService.GenerateRefreshToken(&user, config.RefreshTokenTTL())
	if err != nil {
		logSys.Printf("Error generating refresh token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not issue refresh token"})
		return
	}
	log.InsertLogByUserID(c, user.ID, 11)
	//สร้าง CSRF Token
	csrfToken := h.JwtService.HashTokenSHA256(accessToken)

	// 2. บันทึก Refresh Token Hash ลง DB
	if err := h.JwtService.SaveRefreshToken(h.DB, refreshToken, user.ID); err != nil {
		logSys.Printf("Error saving refresh token to DB: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not process login"})
		return
	}
	setAuthCookies(c, accessToken, refreshToken, csrfToken)
	go service.SendLoginNotification(user.Email, user.Username, c.ClientIP())
	c.JSON(http.StatusOK, LoginResponse{
		ID:       user.ID,
		Username: user.Username,
		Role:     user.Role.Role,
		Message:  "Login successfully",
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
		logSys.Printf("Error deleting refresh tokens for user %d: %v", claims.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not process logout completely"})
		return
	}

	// Clear Cookies ทั้งหมด
	clearAuthCookies(c)
	log.InsertLog(c, 12)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func (h *LoginHandler) Refresh(c *gin.Context) {

	// 1. ดึง Refresh Token จาก Cookie
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		// ... (โค้ดจัดการเมื่อไม่มี Refresh Token (ให้ CSRF Token) เหมือนเดิม)
		return
	}

	// 2. Validate Refresh Token เพื่อดึง Claims
	claims, err := h.JwtService.ValidateRefreshToken(refreshToken)
	if err != nil {
		logSys.Printf("Refresh Token Validation Failed: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
		return
	}

	// 3.ตรวจสอบ Token Replay Attack และลบ Token เก่าใน DB
	if err := h.JwtService.CheckAndRevokeRefreshToken(h.DB, refreshToken, claims.ID); err != nil {
		clearAuthCookies(c)
		// ข้อความนี้สอดคล้องกับ Log ที่คุณเห็น
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or revoked session. Please log in again."})
		return
	}
	// 4. ดึงข้อมูลผู้ใช้จาก DB
	var user entity.User
	if err := h.DB.Preload("Role").First(&user, claims.ID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User data not found"})
		return
	}

	// 5. สร้าง Access Token และ Refresh Token ใหม่
	newAccessToken, err := h.JwtService.GenerateToken(&user, config.AccessTokenTTL())
	if err != nil {
		logSys.Printf("Error generating new access token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not issue new access token"})
		return
	}
	newRefreshToken, err := h.JwtService.GenerateRefreshToken(&user, config.RefreshTokenTTL())
	if err != nil {
		logSys.Printf("Error generating new refresh token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not issue new refresh token"})
		return
	}

	// 6. สร้าง CSRF Token ใหม่
	csrfToken := h.JwtService.HashTokenSHA256(newAccessToken) // ใช้ Hash ของ Access Token เป็น CSRF Token

	// 7. บันทึก Refresh Token ใหม่ลง DB
	if err := h.JwtService.SaveRefreshToken(h.DB, newRefreshToken, user.ID); err != nil {
		logSys.Printf("Error saving new refresh token to DB: %v", err)
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
func setSingleCSRFToken(c *gin.Context, csrfToken string) {
	cookieDomain := config.CookieDomain()

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "csrf_token",
		Value:    csrfToken,
		Path:     "/",
		Domain:   cookieDomain,
		MaxAge:   int(config.RefreshTokenTTL().Seconds()),
		Secure:   true,
		HttpOnly: false,
		SameSite: http.SameSiteLaxMode,
	})
}

func setAuthCookies(c *gin.Context, accessToken, refreshToken, csrfToken string) {
	fmt.Println("!!! DEBUG: HELLO FROM NEW CODE !!! Domain is:", config.CookieDomain())
	cookieDomain := config.CookieDomain()

	// Access Token (HTTP-Only)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		Domain:   cookieDomain,
		MaxAge:   int(config.AccessTokenTTL().Seconds()),
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	// Refresh Token (HTTP-Only)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		Domain:   cookieDomain,
		MaxAge:   int(config.RefreshTokenTTL().Seconds()),
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	setSingleCSRFToken(c, csrfToken)
}

// ForgotPassword Handles
func (h *LoginHandler) ForgotPassword(c *gin.Context) {
	var input ForgotPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username and Email are required"})
		return
	}

	var user entity.User

	normalizedUsername := service.NormalizeUsername(input.Username)

	// 1. ค้นหาผู้ใช้ด้วย Username และ Email
	if err := h.DB.Where("username = ? AND email = ?", normalizedUsername, input.Email).First(&user).Error; err != nil {
		logSys.Printf("INFO: Forgot password request for invalid credential: %s, %s", input.Username, input.Email)
		c.JSON(http.StatusOK, gin.H{"message": "If the account exists, a password reset link has been sent."})
		return
	}

	// 2. สร้าง Reset Token และบันทึก Hash ลง DB
	rawToken, err := service.GenerateAndSaveResetToken(h.DB, user.ID)
	if err != nil {
		logSys.Printf("ERROR: Failed to generate reset token for user %d: %v", user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not process reset request"})
		return
	}

	// 3. ส่งอีเมลพร้อมลิงก์รีเซ็ตรหัสผ่าน
	go service.SendPasswordResetEmail(user.Email, user.Username, rawToken)

	c.JSON(http.StatusOK, gin.H{"message": "If the email exists, a password reset link has been sent."})
}

func (h *LoginHandler) ResetPassword(c *gin.Context) {
	var input ResetPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input format or password too short."})
		return
	}

	if ok, reason := service.IsStrongPassword(input.NewPassword); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": reason})
		return
	}

	userID, err := h.JwtService.ValidateResetToken(h.DB, input.Token)
	if err != nil {
		// กรณี Double Submit หรือ Token หมดอายุ/ถูกใช้ไปแล้ว
		// ให้ตรวจสอบว่ารหัสผ่านปัจจุบันตรงกับรหัสผ่านใหม่หรือไม่
		// ถ้าตรงกัน แสดงว่าคำขอก่อนหน้าทำสำเร็จแล้ว -> ให้ตอบกลับว่า Success
		if (err == service.ErrTokenUsed || err == service.ErrTokenExpired) && userID != 0 {
			var userCheck entity.User
			if dbErr := h.DB.First(&userCheck, userID).Error; dbErr == nil {
				if h.JwtService.CheckPasswordHash(input.NewPassword, userCheck.Password) {
					c.JSON(http.StatusOK, gin.H{"message": "Password has been reset successfully."})
					return
				}
			}
		}

		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// ดึงข้อมูล User เดิมเพื่อรับ Hashed Password ปัจจุบัน
	var user entity.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		logSys.Printf("FATAL: User not found after consuming valid reset token: %d", userID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error during password update"})
		return
	}

	// ห้ามรหัสผ่านซ้ำกับรหัสปัจจุบัน (Strict Check)
	if h.JwtService.CheckPasswordHash(input.NewPassword, user.Password) {
		logSys.Printf("SECURITY VIOLATION: User %d attempted to reuse their current password.", userID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "The new password cannot be the same as your current password."})
		return
	}

	//บันทึกรหัสผ่านเดิมลงใน Password History
	oldPasswordHash := user.Password
	historyEntry := entity.PasswordHistory{
		UserID:          user.ID,
		OldPasswordHash: oldPasswordHash,
	}
	go func() {
		if err := h.DB.Create(&historyEntry).Error; err != nil {
			logSys.Printf("DB HISTORY ERROR: Failed to save password history for user %d: %v", user.ID, err)
		}
	}()

	hashedPassword := h.JwtService.HashPassword(input.NewPassword)

	// อัปเดตรหัสผ่านผู้ใช้
	if err := h.DB.Model(&user).Update("Password", hashedPassword).Error; err != nil {
		logSys.Printf("ERROR: Failed to update password for user %d: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// ลบ Token ทันทีหลังจากที่การอัปเดต Password สำเร็จแล้ว
	if err := h.JwtService.ConsumeResetToken(h.DB, input.Token); err != nil {
		logSys.Printf("CRITICAL WARNING: Password reset successful, but failed to consume token for user %d: %v", userID, err)
	}

	// 8. เพิกถอน Refresh Token ทั้งหมดของ User นี้ทันที
	if err := h.DB.Where("user_id = ?", userID).Delete(&entity.RefreshToken{}).Error; err != nil {
		logSys.Printf("WARNING: Failed to revoke old refresh tokens after password reset for user %d: %v", userID, err)
	}

	// 9. ส่งอีเมลแจ้งเตือนการเปลี่ยนรหัสผ่าน
	go service.SendPasswordChangedNotification(user.Email, user.Username)
	log.InsertLogByUserID(c, user.ID, 13)
	c.JSON(http.StatusOK, gin.H{"message": "Password has been reset successfully. All old sessions have been revoked."})
}

// ChangePassword Handles POST /change-password
func (h *LoginHandler) ChangePassword(c *gin.Context) {
	// Get User ID from Context
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input ChangePasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch User
	var user entity.User
	if err := h.DB.First(&user, claims.ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check Email
	if user.Email != input.Email {
		logSys.Printf("SECURITY: Email mismatch for user %d during password change", user.ID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email does not match our records"})
		return
	}

	// Check Current Password (MUST match specifically)
	if !h.JwtService.CheckPasswordHash(input.CurrentPassword, user.Password) {
		logSys.Printf("SECURITY: Incorrect old password for user %d", user.ID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Incorrect current password"})
		return
	}

	// Validate New Password Strength
	if strong, msg := service.IsStrongPassword(input.NewPassword); !strong {
		c.JSON(http.StatusBadRequest, gin.H{"error": msg})
		return
	}

	// Check if New Password is same as Old
	if h.JwtService.CheckPasswordHash(input.NewPassword, user.Password) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "New password cannot be the same as the current password"})
		return
	}

	// Save to PasswordHistory
	history := entity.PasswordHistory{
		UserID:          user.ID,
		OldPasswordHash: user.Password,
	}
	h.DB.Create(&history)

	// Update Password
	hashedPassword := h.JwtService.HashPassword(input.NewPassword)
	user.Password = hashedPassword
	if err := h.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// Send Email
	go service.SendPasswordChangedNotification(user.Email, user.Username)

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

// clearAuthCookies
func clearAuthCookies(c *gin.Context) {
	cookieDomain := config.CookieDomain()
	isProd := config.IsProduction()


	http.SetCookie(c.Writer, &http.Cookie{Name: "access_token", Value: "", Path: "/", Domain: cookieDomain, MaxAge: -1, Secure: isProd, HttpOnly: true, SameSite: http.SameSiteLaxMode})
	
	http.SetCookie(c.Writer, &http.Cookie{Name: "refresh_token", Value: "", Path: "/", Domain: cookieDomain, MaxAge: -1, Secure: isProd, HttpOnly: true, SameSite: http.SameSiteLaxMode})
	
	http.SetCookie(c.Writer, &http.Cookie{Name: "csrf_token", Value: "", Path: "/", Domain: cookieDomain, MaxAge: -1, Secure: isProd, HttpOnly: false, SameSite: http.SameSiteLaxMode})
}