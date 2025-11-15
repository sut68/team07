package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

func init() {
	// โหลดไฟล์ .env ทันทีที่ package ถูก import
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using default environment variables.")
	} else {
		log.Println("Configuration loaded successfully from .env")
	}
}

// ฟังก์ชัน helper สำหรับดึงค่า string จาก env
func getenv(key, defaultVal string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}
	return defaultVal
}

// ฟังก์ชัน helper สำหรับดึงค่า duration จาก env
func getenvDuration(key string, defaultVal time.Duration) time.Duration {
	valStr := getenv(key, "")
	if valStr == "" {
		return defaultVal
	}
	d, err := time.ParseDuration(valStr)
	if err != nil {
		log.Printf("Invalid duration for %s, using default: %v\n", key, defaultVal)
		return defaultVal
	}
	return d
}

// --- JWT Secrets (ต้องแยก Access และ Refresh Secret Key) ---

// ใช้สำหรับเซ็นชื่อ Access Token และ Refresh Token (ในระบบจริงควรแยกกัน)
func JwtSecret() []byte {
	// ใช้ Key เดียวกันสำหรับทั้ง Access และ Refresh Token เพื่อความง่ายในโค้ดตัวอย่างนี้
	// แต่ผมแนะนำให้ใช้ "JWT_ACCESS_SECRET" และ "JWT_REFRESH_SECRET" แยกกันใน Production
	return []byte(getenv("SECRET_KEY", "super-strong-default-secret-key-in-production"))
}

// --- Token Time-To-Live (TTL) ---

// Access Token มีอายุสั้น
func AccessTokenTTL() time.Duration {
	// 15 นาที
	return getenvDuration("ACCESS_TOKEN_TTL", 15*time.Minute) 
}

// Refresh Token มีอายุยาว
func RefreshTokenTTL() time.Duration {
	// 7 วัน
	return getenvDuration("REFRESH_TOKEN_TTL", 7*24*time.Hour) 
}

// Refresh Token Rotation Cooldown (ป้องกันการ Refresh Token รัวๆ)
func RefreshCooldown() time.Duration {
	// 30 วินาที
	return getenvDuration("REFRESH_COOLDOWN", 30*time.Second) 
}

// --- Cookie Config ---

// ชื่อ Refresh Token Cookie
func RefreshCookieName() string {
	return getenv("REFRESH_COOKIE_NAME", "refresh_token")
}

// Domain สำหรับ Cookie (สำคัญในการ Deploy จริง)
func CookieDomain() string {
	// ใน Dev ใช้ localhost, ใน Prod ใช้ Domain จริง (e.g., your-api.com)
	return getenv("COOKIE_DOMAIN", "localhost") 
}

// Environment Check
func IsProduction() bool {
	return getenv("APP_ENV", "development") == "production"
}