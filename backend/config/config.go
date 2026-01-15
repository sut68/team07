package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

func init() {
	if os.Getenv("SECRET_KEY") != "" {
        log.Println("Configuration loaded from Environment Variables (Docker/Prod).")
        return
    }

	if err := godotenv.Load("../.env"); err != nil { 
		log.Println("WARNING: Cannot find ../.env file. Relying on default values or system environment.")
	} else {
		log.Println("Configuration loaded successfully from ../.env (Local Dev).")
	}
}


func getenv(key, defaultVal string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}
	return defaultVal
}

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

func JwtSecret() []byte {
	return []byte(getenv("SECRET_KEY", "super-strong-default-secret-key-in-production"))
}

func AccessTokenTTL() time.Duration {
	return getenvDuration("ACCESS_TOKEN_TTL", 4*time.Hour) 
}

func RefreshTokenTTL() time.Duration {
	return getenvDuration("REFRESH_TOKEN_TTL", 7*24*time.Hour) 
}

func ResetTokenTTL() time.Duration {
	return getenvDuration("RESET_TOKEN_TTL", 8*time.Minute) 
}

// ป้องกันการ Refresh Token รัวๆ
func RefreshCooldown() time.Duration {
	return getenvDuration("REFRESH_COOLDOWN", 30*time.Second) 
}

func RefreshCookieName() string {
	return getenv("REFRESH_COOKIE_NAME", "refresh_token")
}

// สำคัญในการ Deploy จริง
func CookieDomain() string {
	return getenv("COOKIE_DOMAIN", "localhost") 
}

// Environment Check
func IsProduction() bool {
	return getenv("APP_ENV", "development") == "production"
}

func FrontendURL() string {
    return os.Getenv("FRONTEND_URL") 
}

func RefreshSecret() []byte {
    return []byte(getenv("REFRESH_SECRET_KEY", "super-strong-default-refresh-secret"))
}