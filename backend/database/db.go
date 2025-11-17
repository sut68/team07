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
	fmt.Println("DSN used (Sensitive parts hidden):", dsn)
	
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
	)

	db.AutoMigrate(
		&entity.User{},
		&entity.RefreshToken{},
		&entity.ResetPasswordToken{},
		&entity.Project{},
		&entity.Topic{},
		&entity.Criteria{},
		&entity.Room{},
		&entity.AppointmentType{},
	)

	db.AutoMigrate(
		&entity.GroupProject{},
		&entity.GroupMember{},
		&entity.TopicSelection{},
		&entity.TopicApproval{},
		&entity.Evaluation{},
		&entity.IssueReport{},
		&entity.SelectAdvisor{},
		&entity.Appointment{},
		&entity.Schedule{},
		&entity.Progress{},
		&entity.Chat{},
		&entity.Log{},
		&entity.IndividualScore{},
		&entity.EvaResult{},
		&entity.ProjectStorage{},
	)
}

func CORSMiddleware() gin.HandlerFunc {
	allowedOrigin := config.FrontendURL()

	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:5173"
	}

	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
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

func CheckGetENV() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file. Make sure .env exists and is accessible.")
	}
}
