package service

import (
	"log"
	"time"

	"github.com/sut68/team07/backend/entity"
	"gorm.io/gorm"
)

// ลบ Refresh Token และ Reset Password Token ที่หมดอายุแล้วออกจาก DB
func CleanExpiredTokens(db *gorm.DB) {
	now := time.Now().Unix()
	resultRefresh := db.Where("expires_at < ?", now).Delete(&entity.RefreshToken{})

	if resultRefresh.Error != nil {
		log.Printf("ERROR: Failed to clean up expired Refresh Tokens: %v", resultRefresh.Error)
	} else if resultRefresh.RowsAffected > 0 {
		log.Printf("SUCCESS: Cleaned up %d expired Refresh Tokens.", resultRefresh.RowsAffected)
	}

	// ลบ Reset Token ที่ ExpiresAt น้อยกว่าเวลาปัจจุบัน
	resultReset := db.Where("expires_at < ?", now).Delete(&entity.ResetPasswordToken{})

	if resultReset.Error != nil {
		log.Printf("ERROR: Failed to clean up expired Reset Tokens: %v", resultReset.Error)
	} else if resultReset.RowsAffected > 0 {
		log.Printf("SUCCESS: Cleaned up %d expired Reset Tokens.", resultReset.RowsAffected)
	}
}

// ฟังก์ชันลบ Log ที่เก่ากว่า 6 เดือน (Hard Delete)
func CleanOldLogs(db *gorm.DB) {
	now := time.Now()
	isCleanupDay := now.Day() == 1 && (now.Month() == time.January || now.Month() == time.July)

	if isCleanupDay {
		// ย้อนหลัง 6 เดือน
		sixMonthsAgo := now.AddDate(0, -6, 0)

		result := db.Unscoped().Where("created_at < ?", sixMonthsAgo).Delete(&entity.Log{})

		if result.Error != nil {
			log.Printf("ERROR: Failed to clean up old logs: %v", result.Error)
		} else if result.RowsAffected > 0 {
			log.Printf("SUCCESS: Cleaned up %d old logs (Hard Delete).", result.RowsAffected)
		} else {
			log.Println("Pool cleanup: No old logs to delete.")
		}
	}
}

// เพื่อทำความสะอาด Token ที่หมดอายุทุกๆ  2 ชั่วโมง
func StartCleanupWorker(db *gorm.DB) {
	CleanExpiredTokens(db)
	CleanOldLogs(db)
	ticker := time.NewTicker(2 * time.Hour)
	log.Println("Background Token Cleanup Worker started. Running every 2 hours.")

	go func() {
		for range ticker.C {
			log.Println("--- Running Scheduled Token Cleanup ---")
			CleanExpiredTokens(db)
			CleanOldLogs(db)
		}
	}()
}

