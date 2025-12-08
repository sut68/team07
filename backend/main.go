package main

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/appointment"
	"github.com/sut68/team07/backend/controller/auth"
	"github.com/sut68/team07/backend/controller/chat"
	"github.com/sut68/team07/backend/controller/evaluation"
	"github.com/sut68/team07/backend/controller/group"
	"github.com/sut68/team07/backend/controller/issues"
	"github.com/sut68/team07/backend/controller/progress"
	"github.com/sut68/team07/backend/controller/users"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/middleware"
	mockdata "github.com/sut68/team07/backend/mockData"
	"github.com/sut68/team07/backend/service"

)

func main() {

	database.ConnectDatabase()
	database.SetUpDatabase()
	//========INSERT MOCK DATA================
	Data := database.DB()
	mockdata.InsertMock(Data)
	//=========================================
	service.InitEmailConfig()
	service.StartCleanupWorker(database.DB())
	r := gin.Default()
	r.Use(database.CORSMiddleware())

	// test controller Group
	r.GET("/group", group.GetGroupProject)
	r.POST("/addMember", group.PostGroupMember)

	authHandler := auth.NewLoginHandler()

	r.POST("/login", authHandler.Login)
	r.POST("/refresh", authHandler.Refresh)
	r.POST("/forgot-password", authHandler.ForgotPassword)
	r.POST("/reset-password", authHandler.ResetPassword)

	

	protected := r.Group("/")
	protected.Use(middleware.CSRFCheckMiddleware(), middleware.AuthMiddleware())
	{

		// user ทุก Role สามารถเข้าถึงได้
		protected.GET("/GetChat", chat.GetAllChat)
		protected.POST("/SendChat", chat.InsertChat)
		protected.DELETE("/DeleteChat", chat.DeleteChat)
		protected.GET("/getUserProfile", users.GetUserProfile)
		protected.PATCH("/updateUserProfile", users.UpdateUserProfile)
		protected.GET("/me", authHandler.Me)

		adminGroup := protected.Group("/admin")
		adminGroup.Use(middleware.RoleGuard("Admin"))
		{
			// ถ้า API ไหนที่แอดมินเข้าถึงได้ ให้นำไปใส่ในนี้
			adminGroup.GET("/getGender", users.GetGender)
			adminGroup.GET("/getIssueStatus", issues.GetIssueStatus)
			// Evaluation and Appointment Admin
			adminGroup.POST("/createAppointmentTypes", appointment.CreateAppointmentType) 
    		adminGroup.DELETE("/deleteAppointmentTypes/:id", appointment.DeleteAppointmentType)
			adminGroup.GET("/criteria", evaluation.ListCriteria)
			adminGroup.GET("/criteria/:id", evaluation.GetCriteria)
			adminGroup.POST("/createCriteria", evaluation.CreateCriteria)
			adminGroup.PATCH("/updateCriteria/:id", evaluation.UpdateCriteria)
			adminGroup.DELETE("/deleteCriteria/:id", evaluation.DeleteCriteria)
			adminGroup.POST("/createCriteriaLevel", evaluation.CreateCriteriaLevel)
			adminGroup.PATCH("/updateCriteriaLevel/:id", evaluation.UpdateCriteriaLevel)
			adminGroup.DELETE("/deleteCriteriaLevel/:id", evaluation.DeleteCriteriaLevel)
			adminGroup.POST("/importUsersCSV", users.ImportUsersCSV)	

		}

		teacherGroup := protected.Group("/teacher")
		teacherGroup.Use(middleware.RoleGuard("Teacher"))
		{
			// Appointment ================================
			teacherGroup.GET("/listAppointments", appointment.ListAppointments)
			teacherGroup.GET("/appointments/:id", appointment.GetAppointment)
			teacherGroup.GET("/rooms", appointment.ListRooms)
			teacherGroup.GET("/appointmentTypes", appointment.ListAppointmentTypes)
			teacherGroup.GET("/groups/search", appointment.SearchGroup)
			teacherGroup.GET("/groups/random", appointment.GetRandomGroup)
			teacherGroup.POST("/createAppointment", appointment.CreateAppointment)
			teacherGroup.POST("/autoCreateAppointments", appointment.AutoCreateAppointments)
			teacherGroup.PATCH("/updateAppointment/:id", appointment.UpdateAppointment)
			teacherGroup.POST("/createRoom", appointment.CreateRoom)
			teacherGroup.DELETE("/deleteAppointment/:id", appointment.DeleteAppointment)
			// Evaluation ===================================
			teacherGroup.GET("/evaluation/projects", evaluation.ListEvaluationProjects)
			teacherGroup.GET("/evaluation/form/:appointment_id", evaluation.GetEvaluationForm)
			teacherGroup.GET("/evaluation/result/:appointment_id", evaluation.GetEvaluationResult)
			teacherGroup.GET("/evaluation/summary/:group_project_id", evaluation.GetEvaluationSummary)
			teacherGroup.POST("/evaluation/save", evaluation.SaveEvaluation)
			// ===============================================

		}

		studentGroup := protected.Group("/student")
		studentGroup.Use(middleware.RoleGuard("Student"))
		{
			// ถ้า API ไหนที่นักเรียนเข้าถึงได้ ให้นำไปใส่ในนี้
			studentGroup.GET("/getProcess", progress.GetProGressByID)
			studentGroup.POST("/assignProgress", progress.AssignProGress)
			studentGroup.POST("/modifyProgress", progress.UpdateProGress)
			studentGroup.DELETE("/deleteProgress", progress.DeleteProgress)
			
			// Group
			// studentGroup.GET("/group", group.GetGroupProject)
			// studentGroup.POST("/addMember", group.PostGroupMember)

			// Evaluation and Appointment
			studentGroup.GET("/myAppointment", appointment.GetMyProjectAndAppointment)
    		studentGroup.GET("/myEvaluation", evaluation.GetMyEvaluationResult)

		}

		teacherOrStudentGroup := protected.Group("/groupProject")
		teacherOrStudentGroup.Use(middleware.RoleGuard("Teacher", "Student"))
		{
			// ถ้า API ไหนที่ครูและนักเรียนเข้าถึงได้ ให้นำไปใส่ในนี้

		}

		protected.POST("/logout", authHandler.Logout)
	}

	r.Run(":8080")
}
