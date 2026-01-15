package database

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sut68/team07/backend/config"
	"github.com/sut68/team07/backend/entity"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func ConnectDatabase() {
	// 1. Load .env first
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using system environment variables only")
	}

	// 2. Now read env vars
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Println("DATABASE_URL not found, using segmented config from .env...")

		dbHost := os.Getenv("DB_HOST")
		dbPort := os.Getenv("DB_PORT")
		dbSSLMode := os.Getenv("DB_SSLMODE")
		dbUser := os.Getenv("DB_USER")
		dbPassword := os.Getenv("DB_PASSWORD")
		dbName := os.Getenv("DB_NAME")

		if dbUser == "" || dbHost == "" || dbName == "" {
			log.Fatal("Critical: One or more database configuration variables (DB_HOST, DB_USER, DB_NAME) is missing in .env. Cannot connect.")
		}

		dsn = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
			dbHost,
			dbUser,
			dbPassword,
			dbName,
			dbPort,
			dbSSLMode,
		)
	}

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("Database connected successfully to PostgreSQL")
	db = database
}

func SetUpDatabase() {
	// ผมเเยก AutoMigrate เพราะให้มันจัดลำดับการสร้างตารางได้ง่ายขึ้น
	db.AutoMigrate(
		&entity.Gender{},
		&entity.UserRole{},
		&entity.AccountStatus{},
		&entity.Branch{},
		&entity.IssueStatus{},
		&entity.IssueType{},
		&entity.ActionType{},
		&entity.Room{},
		&entity.AppointmentType{},
	)

	db.AutoMigrate(
		&entity.User{},
		&entity.RefreshToken{},
		&entity.ResetPasswordToken{},
		&entity.PasswordHistory{},
		&entity.Notification{},
	)

	db.AutoMigrate(
		&entity.Project{},
		&entity.GroupProject{},
		&entity.Evaluation{},
		&entity.Criteria{},
		&entity.CriteriaLevel{},
		&entity.Topic{},
	)

	db.AutoMigrate(
		&entity.GroupMember{},
		&entity.SelectAdvisor{},
		&entity.AdvisorStatus{},
		&entity.TopicSelection{},
		&entity.TopicApproval{},
		&entity.Appointment{},
		&entity.ProjectStorage{},
		&entity.IssueReport{},
		&entity.Chat{},
		&entity.Log{},
		&entity.News{},
	)

	db.AutoMigrate(
		&entity.Progress{},
		&entity.EvaResult{},
		&entity.IndividualScore{},
	)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		allowedOrigins := []string{
			"http://localhost:5173",
			"http://localhost:3000",
			"https://capstonehub.me",
		}

		origin := c.Request.Header.Get("Origin")
		allow := false

		// Check if origin is in our allowed list
		for _, o := range allowedOrigins {
			if o == origin {
				allow = true
				break
			}
		}

		// Also check the configured FRONTEND_URL
		configOrigin := config.FrontendURL()
		if origin == configOrigin {
			allow = true
		}

		// If no match found but we have a config, use the config
		// If matched, use the request origin to satisfy the browser
		finalOrigin := configOrigin
		if allow {
			finalOrigin = origin
		} else if finalOrigin == "" {
			// Fallback default if nothing configured and no match (dev mode convenience)
			finalOrigin = "http://localhost:3000"
		}

		c.Writer.Header().Set("Access-Control-Allow-Origin", finalOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
