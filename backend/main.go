package main

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller.go/auth"
	"github.com/sut68/team07/backend/controller.go/issues"
	"github.com/sut68/team07/backend/controller.go/progress"
	"github.com/sut68/team07/backend/controller.go/users"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/middleware"
	mockdata "github.com/sut68/team07/backend/mockData"
)

func main() {

	database.CheckGetENV()
	database.ConnectDatabase()
	database.SetUpDatabase()
	//============== Insert Data ===============
	Data := database.DB()
	mockdata.InsertMock(Data)
	//=========================================
	r := gin.Default()
	r.Use(database.CORSMiddleware())

	authHandler := auth.NewLoginHandler()

	r.POST("/login", authHandler.Login)
	r.POST("/refresh", authHandler.Refresh)

	protected := r.Group("/")
	protected.Use(middleware.CSRFCheckMiddleware(), middleware.AuthMiddleware())
	{ 
		
		// user ทุก Role สามารถเข้าถึงได้
		protected.GET("/me", authHandler.Me)

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
			
			protected.GET("/getProcess", progress.GetProGressByID)
			protected.POST("/assignProgress", progress.AssignProGress)
			protected.POST("/modifyProgress", progress.UpdateProGress)
			protected.DELETE("/deleteProgress", progress.DeleteProgress)

		}

		protected.POST("/logout", authHandler.Logout)
	}

	r.Run(":8080")
}
