package main

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller.go/auth"
	"github.com/sut68/team07/backend/controller.go/chat"
	"github.com/sut68/team07/backend/controller.go/issues"
	"github.com/sut68/team07/backend/controller.go/progress"
	"github.com/sut68/team07/backend/controller.go/users"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/middleware"
	mockdata "github.com/sut68/team07/backend/mockData"
	"github.com/sut68/team07/backend/service"
)

func main() {

	database.CheckGetENV()
	database.ConnectDatabase()
	database.SetUpDatabase()
	Data := database.DB()
	mockdata.InsertMock(Data)
	//=========================================
	service.InitEmailConfig()
	service.StartCleanupWorker(database.DB())
	r := gin.Default()
	r.Use(database.CORSMiddleware())

	authHandler := auth.NewLoginHandler()

	r.POST("/login", authHandler.Login)
	r.POST("/refresh", authHandler.Refresh)
	r.POST("/forgot-password", authHandler.ForgotPassword)
	r.POST("/reset-password", authHandler.ResetPassword)


	protected := r.Group("/")
	protected.Use(middleware.CSRFCheckMiddleware(), middleware.AuthMiddleware())
	{

		// user ทุก Role สามารถเข้าถึงได้
		protected.GET("/me", authHandler.Me)
		protected.GET("/GetChat",chat.GetAllChat)
		protected.POST("/SendChat",chat.InsertChat)
		protected.DELETE("/DeleteChat",chat.DeleteChat)

		// Route ที่ต้องการสิทธิ์เฉพาะ (Admin Only)

		adminGroup := protected.Group("/admin")
		adminGroup.Use(middleware.RoleGuard("Admin"))
		{
			adminGroup.GET("/getGender", users.GetGender)
			adminGroup.GET("/getIssueStatus", issues.GetIssueStatus)
		}

		teacherGroup := protected.Group("/data")
		teacherGroup.Use(middleware.RoleGuard("Teacher"))
		{

		}
		studentGroup := protected.Group("/student")
		studentGroup.Use(middleware.RoleGuard("Student"))
		{
			
			studentGroup.GET("/getProcess", progress.GetProGressByID)
			studentGroup.POST("/assignProgress", progress.AssignProGress)
			studentGroup.POST("/modifyProgress", progress.UpdateProGress)
			studentGroup.DELETE("/deleteProgress", progress.DeleteProgress)

		}

		protected.POST("/logout", authHandler.Logout)
	}

	r.Run(":8080")
}
