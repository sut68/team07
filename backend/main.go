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

		adminGroup := protected.Group("/admin")
		adminGroup.Use(middleware.RoleGuard("Admin"))
		{
			// ถ้า API ไหนที่แอดมินเข้าถึงได้ ให้นำไปใส่ในนี้
			adminGroup.GET("/getGender", users.GetGender)
			adminGroup.GET("/getIssueStatus", issues.GetIssueStatus)
		}
		teacherOrStudentGroup := protected.Group("/groupProject")
		teacherOrStudentGroup.Use(middleware.RoleGuard("Teacher", "Student"))
		{
			// ถ้า API ไหนที่ครูและนักเรียนเข้าถึงได้ ให้นำไปใส่ในนี้

		}
		teacherGroup := protected.Group("/data")
		teacherGroup.Use(middleware.RoleGuard("Teacher"))
		{
			// ถ้า API ไหนที่ครูเข้าถึงได้ ให้นำไปใส่ในนี้
		}
		studentGroup := protected.Group("/student")
		studentGroup.Use(middleware.RoleGuard("Student"))
		{
			// ถ้า API ไหนที่นักเรียนเข้าถึงได้ ให้นำไปใส่ในนี้
			studentGroup.GET("/getProcess", progress.GetProGressByID)
			studentGroup.POST("/assignProgress", progress.AssignProGress)
			studentGroup.POST("/modifyProgress", progress.UpdateProGress)
			studentGroup.DELETE("/deleteProgress", progress.DeleteProgress)

		}

		protected.POST("/logout", authHandler.Logout)
	}

	r.Run(":8080")
}