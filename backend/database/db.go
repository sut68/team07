package database

import (
	"fmt"
	"log"
	"os"
	"github.com/sut68/team07/backend/entity"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func ConnectDatabase() {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_SSLMODE"),
	)
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("Database connected successfully to PostgreSQL")
	fmt.Println("Database Name : ",os.Getenv("DB_NAME"))

	db = database
}

func SetUpDatabase() {
	db.AutoMigrate(
		&entity.AccountStatus{},
		&entity.ActionType{},
		&entity.AppointmentType{},
		&entity.Appointment{},
		&entity.Branch{},
		&entity.Chat{},
		&entity.Criteria{},
		&entity.Evaluation{},
		&entity.EvaResult{},
		&entity.Gender{},
		&entity.Group{},
		&entity.IndividualScore{},
		&entity.IssueReport{},
		&entity.IssueStatus{},
		&entity.IssueType{},
		&entity.Logs{},
		&entity.Progress{},
		&entity.Project{},
		&entity.ProjectTopic{},
		&entity.Room{},
		&entity.Schedule{},
		&entity.StudentInfo{},
		&entity.TeacherInfo{},
		&entity.TopicApproval{},
		&entity.TopicSelection{},
		&entity.User{},
		&entity.UserRole{},
	)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
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