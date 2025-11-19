package service

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"net/smtp"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/sut68/team07/backend/config"
	"github.com/sut68/team07/backend/entity"
	"gorm.io/gorm"
)

type EmailConfig struct {
	SenderEmail string
	SenderName  string
	Username    string
	Host        string
	Port        string
	Password    string
}

var EmailConfigPublic EmailConfig

func InitEmailConfig() {
	godotenv.Load() 

	EmailConfigPublic = EmailConfig{
		SenderEmail: os.Getenv("SMTP_SENDER_EMAIL"),
		SenderName:  os.Getenv("SMTP_SENDER_NAME"),
		Username:    os.Getenv("SMTP_USERNAME"),
		Host:        os.Getenv("SMTP_HOST"),
		Port:        os.Getenv("SMTP_PORT"),
		Password:    os.Getenv("SMTP_PASSWORD"),
	}
	if EmailConfigPublic.SenderEmail == "" || EmailConfigPublic.Password == "" {
		log.Println("WARNING: SMTP configuration is incomplete. Email notifications will be disabled.")
	} else {
		log.Println("Email service initialized successfully.")
	}
}

// เป็นฟังก์ชันหลักสำหรับการส่งอีเมลผ่าน SMTP
func sendEmail(recipientEmail, subject, body string) error {
	// ตรวจสอบว่า Email Service ถูกเปิดใช้งานหรือไม่
	if EmailConfigPublic.SenderEmail == "" || EmailConfigPublic.Password == "" {
		return fmt.Errorf("email service is disabled")
	}

	to := []string{recipientEmail}
	
	// สร้างรูปแบบข้อความอีเมลที่สมบูรณ์ (รวม header)
	msg := []byte(
		"From: " + EmailConfigPublic.SenderName + " <" + EmailConfigPublic.SenderEmail + ">\r\n" +
			"To: " + recipientEmail + "\r\n" +
			"Subject: " + subject + "\r\n" +
			"Content-Type: text/plain; charset=UTF-8\r\n" +
			"\r\n" +
			body,
	)

	// การยืนยันตัวตนและการส่งอีเมลผ่าน SMTP (ใช้ PlainAuth)
	auth := smtp.PlainAuth("", EmailConfigPublic.Username, EmailConfigPublic.Password, EmailConfigPublic.Host)
	addr := EmailConfigPublic.Host + ":" + EmailConfigPublic.Port

	err := smtp.SendMail(addr, auth, EmailConfigPublic.SenderEmail, to, msg)
	return err
}

func SendLoginNotification(recipientEmail, username, ipAddress string) {
	subject := "มีการเข้าสู่ระบบบัญชีของคุณ - Security Alert"
	loginTime := time.Now().Format("2 January 2006, 15:04:05 MST")

	body := fmt.Sprintf(
		"เรียนคุณ %s,\n\n"+
			"บัญชีของคุณเพิ่งเข้าสู่ระบบสำเร็จ:\n"+
			"--------------------------------------------------\n"+
			"เวลาที่เข้าสู่ระบบ: %s\n"+
			"IP Address: %s\n"+
			"--------------------------------------------------\n\n"+
			"หากคุณไม่ใช่ผู้ดำเนินการ โปรดติดต่อผู้ดูแลระบบทันที\n\n"+
			"ขอแสดงความนับถือ,\n"+
			"%s",
		username,
		loginTime,
		ipAddress,
		EmailConfigPublic.SenderName,
	)

	err := sendEmail(recipientEmail, subject, body)
	if err != nil {
		log.Printf("ERROR: Failed to send login notification email to %s: %v", recipientEmail, err)
		return
	}

	log.Printf("SUCCESS: Sent login notification email to %s", recipientEmail)
}


// คืนค่า Token จริง สำหรับส่งในอีเมล
func GenerateAndSaveResetToken(db *gorm.DB, userID uint) (string, error) {
	// 1. สร้าง Secure Random Token String (Token จริง)
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate random token: %w", err)
	}
	rawToken := base64.URLEncoding.EncodeToString(b)
	
	// 2. Hash Token สำหรับบันทึกใน DB (ป้องกันการขโมย Token จาก DB)
    tokenHash := HashTokenSHA256(rawToken)

	expiry := time.Now().Add(config.ResetTokenTTL()) 

	// 4. สร้าง Entity และบันทึก
	newToken := entity.ResetPasswordToken{
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: expiry.Unix(),
	}

	// ลบ Token ที่เคยมีอยู่ก่อนหน้าของ User นี้ เพื่อป้องกันปัญหาเมื่อ User กด Forgot Password ซ้ำ
	db.Where("user_id = ?", userID).Delete(&entity.ResetPasswordToken{})

	if err := db.Create(&newToken).Error; err != nil {
		return "", fmt.Errorf("failed to save reset password token: %w", err)
	}

	log.Printf("SUCCESS: Generated and saved Reset Token Hash for User ID %d", userID)

	return rawToken, nil
}

// ส่งอีเมลพร้อมลิงก์สำหรับตั้งรหัสผ่านใหม่
func SendPasswordResetEmail(recipientEmail, username, rawToken string) {
	if EmailConfigPublic.SenderEmail == "" || EmailConfigPublic.Password == "" {
		log.Println("WARNING: Email service is disabled. Cannot send reset password email.")
		return
	}

	frontendURL := config.FrontendURL()
	if frontendURL == "" {
		log.Println("ERROR: FRONTEND_URL is not set. Cannot construct reset link.")
		return
	}
	
	// สร้างลิงก์ Reset Password เต็มรูปแบบ
	resetLink := fmt.Sprintf("%s/login/resetPassword?token=%s", frontendURL, rawToken)
	
	// ใช้ค่า TTL จาก Config เพื่อแสดงในอีเมล
	ttlMinutes := int(config.ResetTokenTTL().Minutes()) 

	subject := "คำขอตั้งรหัสผ่านใหม่สำหรับ Capstone Hub"
	
	body := fmt.Sprintf(
		"เรียนคุณ %s,\n\n"+
			"เราได้รับคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ กรุณาคลิกลิงก์ด้านล่างเพื่อดำเนินการต่อ:\n\n"+
			"%s\n\n"+
			"ลิงก์นี้จะหมดอายุภายใน %d นาที หากคุณไม่ได้ร้องขอการเปลี่ยนรหัสผ่าน โปรดเพิกเฉยต่ออีเมลนี้\n\n"+
			"ขอแสดงความนับถือ,\n"+
			"%s",
		username,
		resetLink,
		ttlMinutes,
		EmailConfigPublic.SenderName,
	)

	err := sendEmail(recipientEmail, subject, body)
	if err != nil {
		log.Printf("ERROR: Failed to send password reset email to %s: %v", recipientEmail, err)
		return
	}

	log.Printf("SUCCESS: Sent password reset email to %s", recipientEmail)
}

// ส่งอีเมลแจ้งเตือนผู้ใช้ว่ารหัสผ่านได้รับการเปลี่ยนแปลงแล้ว
func SendPasswordChangedNotification(recipientEmail, username string) {
	subject := "รหัสผ่านบัญชี Capstone Hub ได้รับการเปลี่ยนแปลง"

	body := fmt.Sprintf(
		"เรียนคุณ %s,\n\n"+
			"รหัสผ่านสำหรับบัญชีของคุณได้รับการเปลี่ยนแปลงเรียบร้อยแล้วในเวลา %s\n\n"+
			"หากคุณไม่ได้ดำเนินการนี้ด้วยตนเอง โปรดติดต่อผู้ดูแลระบบทันที\n\n"+
			"ขอแสดงความนับถือ,\n"+
			"%s",
		username,
		time.Now().Format("2 January 2006, 15:04:05 MST"),
		EmailConfigPublic.SenderName,
	)

	err := sendEmail(recipientEmail, subject, body)
	if err != nil {
		log.Printf("ERROR: Failed to send password changed notification email to %s: %v", recipientEmail, err)
		return
	}

	log.Printf("SUCCESS: Sent password changed notification email to %s", recipientEmail)
}