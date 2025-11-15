package main

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller.go/auth"
	"github.com/sut68/team07/backend/controller.go/issues"
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
	// ถ้าเพิ่มข้อมูลไม่ได้ให้ไป ปรับ mockDataCreate = false
	Data := database.DB()
	mockdata.InsertMock(Data)
	//=================================
	r := gin.Default()
	r.Use(database.CORSMiddleware())

	authHandler := auth.NewLoginHandler()

	r.POST("/login", authHandler.Login)
	r.POST("/refresh", authHandler.Refresh)

	protected := r.Group("/")
	protected.Use(middleware.AuthMiddleware()) // Middleware ตรวจสอบ Access Token
	{
		// 1. Route ทั่วไปที่ต้องการแค่ Login (สำหรับดู Profile ตัวเอง)
		protected.GET("/me", authHandler.Me) // (ต้องสร้างฟังก์ชัน Me ใน Controller ก่อน)

		// 2. Route ที่ต้องการสิทธิ์เฉพาะ (Admin Only)
		adminGroup := protected.Group("/admin")
		adminGroup.Use(middleware.RoleGuard("Admin")) // ตรวจสอบว่า Role ต้องเป็น "Admin"
		{
			r.GET("/getGender", users.GetGender)
			r.GET("/getIssueStatus", issues.GetIssueStatus)
		}

		// 3. Route ที่ต้องการสิทธิ์ Admin หรือ Teacher
		teacherOrAdminGroup := protected.Group("/data")
		teacherOrAdminGroup.Use(middleware.RoleGuard("Admin", "Teacher"))
		{
			// teacherOrAdminGroup.GET("/reports", reportController.GetReports)
		}
		studentGroup := protected.Group("/student")
		studentGroup.Use(middleware.RoleGuard("Student"))
		{
			// studentGroup.GET("/assignments", studentController.GetAssignments)
		}

		// 4. Logout
		protected.POST("/logout", authHandler.Logout)
	}
	
	r.Run(":8080")
}
