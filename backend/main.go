package main

import (
	"os"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/appointment"
	"github.com/sut68/team07/backend/controller/auth"
	"github.com/sut68/team07/backend/controller/chat"
	"github.com/sut68/team07/backend/controller/evaluation"
	"github.com/sut68/team07/backend/controller/group"
	"github.com/sut68/team07/backend/controller/importuser"
	"github.com/sut68/team07/backend/controller/issues"
	"github.com/sut68/team07/backend/controller/progress"
	"github.com/sut68/team07/backend/controller/topic"
	"github.com/sut68/team07/backend/controller/updateStatus"
	"github.com/sut68/team07/backend/controller/users"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/middleware"
	mockdata "github.com/sut68/team07/backend/mockData"
	"github.com/sut68/team07/backend/service"
)

func main() {
	database.ConnectDatabase()
	database.SetUpDatabase()

	// ถ้าอยาก Mock ข้อมูล ให้รันคำสั่ง go run main.go --seed หรือ go run main.go seed ****ถ้า go run main.go จะไม่ Mock ข้อมูล ****
	if len(os.Args) > 1 && (os.Args[1] == "--seed" || os.Args[1] == "seed") {
		Data := database.DB()
		mockdata.InsertMock(Data)
	}

	service.InitEmailConfig()
	service.StartCleanupWorker(database.DB())
	r := gin.Default()
	r.Use(database.CORSMiddleware())
	r.Static("/uploads", "./uploads")

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
		protected.GET("/GetProcessID", chat.GetProcessIDbyGroupID)
		protected.POST("/SendChat", chat.InsertChat)
		protected.DELETE("/DeleteChat", chat.DeleteChat)
		protected.GET("/getUserProfile", users.GetUserProfile)
		protected.PATCH("/updateUserProfile", users.UpdateUserProfile)
		protected.GET("/me", authHandler.Me)

		// Group
		protected.GET("/academicYears", group.GetAcademicYears)
		r.GET("/group", group.GetGroupProject)
		// r.POST("/addMember", group.PostGroupMember)

		adminGroup := protected.Group("/admin")
		adminGroup.Use(middleware.RoleGuard("Admin"))
		{
			// ถ้า API ไหนที่แอดมินเข้าถึงได้ ให้นำไปใส่ในนี้
			adminGroup.GET("/genders", users.GetGenders)
			adminGroup.GET("/branches", users.GetBranches)
			adminGroup.GET("/roles", users.GetRoles)
			adminGroup.GET("/statuses", users.GetUserStatuses)
			adminGroup.GET("/getIssueStatus", issues.GetIssueStatus)

			adminGroup.POST("/importUsersCSV", importuser.ImportUsersHandler)
			adminGroup.PATCH("/issues/:id", issues.UpdateIssueStatus)
			adminGroup.GET("/users", users.ListUsers)
			adminGroup.POST("/user", users.CreateUser)
            adminGroup.DELETE("/user/:id", users.DeleteUser)

			// Group
			adminGroup.GET("/studentCount", group.GetEligibleStudentCount)
			adminGroup.POST("/generateGroups", group.GenerateGroups)

			adminGroup.GET("/group/:id", group.GetGroupDetailById)
			adminGroup.GET("/students/search", group.SearchAvailableStudents)
			adminGroup.POST("/group/addMember", group.AddMemberToGroup)
			adminGroup.POST("/group/removeMember", group.RemoveMemberFromGroup)
			adminGroup.POST("/group/changeLeader", group.ChangeLeader)
			adminGroup.DELETE("/group/:id", group.DeleteGroup)

			adminGroup.GET("/teachers/search", group.GetAllTeachers)
			adminGroup.POST("/group/updateAdvisor", group.UpdateGroupAdvisor)

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
			// Evaluation and Appointment Admin
			teacherGroup.POST("/createAppointmentTypes", appointment.CreateAppointmentType)
			teacherGroup.DELETE("/deleteAppointmentTypes/:id", appointment.DeleteAppointmentType)
			teacherGroup.GET("/criteria", evaluation.ListCriteria)
			teacherGroup.GET("/criteria/:id", evaluation.GetCriteria)
			teacherGroup.POST("/createCriteria", evaluation.CreateCriteria)
			teacherGroup.PATCH("/updateCriteria/:id", evaluation.UpdateCriteria)
			teacherGroup.DELETE("/deleteCriteria/:id", evaluation.DeleteCriteria)
			teacherGroup.POST("/createCriteriaLevel", evaluation.CreateCriteriaLevel)
			teacherGroup.PATCH("/updateCriteriaLevel/:id", evaluation.UpdateCriteriaLevel)
			teacherGroup.DELETE("/deleteCriteriaLevel/:id", evaluation.DeleteCriteriaLevel)
			// == Topic ===========================
			teacherGroup.PATCH("/topics/:id/approval", topic.ApproveTopic)
			teacherGroup.GET("/topics", topic.ListTopics)
			teacherGroup.GET("/topics/:id", topic.GetTopic)
			teacherGroup.POST("/topics", topic.CreateTopic)
			teacherGroup.PATCH("/topics/:id", topic.UpdateTopic)
			teacherGroup.DELETE("/topics/:id", topic.DeleteTopic)
			// Status Update
			teacherGroup.PATCH("/groups/:id/status", updateStatus.UpdateGroupStatus)
		}

		studentGroup := protected.Group("/student")
		studentGroup.Use(middleware.RoleGuard("Student"))
		{
			// ถ้า API ไหนที่นักเรียนเข้าถึงได้ ให้นำไปใส่ในนี้
			studentGroup.GET("/getProcess", progress.GetProGressByID)
			studentGroup.GET("/getProjectbyuser",progress.GetGroupProjectIDByStudentID)
			studentGroup.POST("/assignProgress", progress.AssignProGress)
			studentGroup.POST("/modifyProgress", progress.UpdateProGress)
			studentGroup.DELETE("/deleteProgress", progress.DeleteProgress)

			// Group
			//studentGroup.GET("/group", group.GetGroupProject)
			studentGroup.GET("/myGroup", group.GetMyGroup)
			studentGroup.POST("/addMember", group.PostGroupMember)

			// Evaluation and Appointment
			studentGroup.GET("/myAppointment", appointment.GetMyProjectAndAppointment)
			studentGroup.GET("/evaluation/form", evaluation.GetStudentEvaluationForm)
			studentGroup.GET("/evaluation/result", evaluation.GetStudentEvaluationResult)
			studentGroup.POST("/evaluation/peer", evaluation.SavePeerEvaluation)

			// Topic Selection
			studentGroup.GET("/topic", topic.GetStudentTopic)
			studentGroup.POST("/topics/:id/select", topic.SelectTopic)
			studentGroup.POST("/topics/cancel-selection", topic.CancelSelection)
		}

		teacherOrStudentGroup := protected.Group("/groupProject")
		teacherOrStudentGroup.Use(middleware.RoleGuard("Teacher", "Student"))
		{
			// ถ้า API ไหนที่ครูและนักเรียนเข้าถึงได้ ให้นำไปใส่ในนี้
			teacherOrStudentGroup.GET("/topics", topic.ListTopics)
			teacherOrStudentGroup.GET("/topics/:id", topic.GetTopic)
			teacherOrStudentGroup.POST("/topics", topic.CreateTopic)
			teacherOrStudentGroup.PATCH("/topics/:id", topic.UpdateTopic)
			teacherOrStudentGroup.DELETE("/topics/:id", topic.DeleteTopic)

		}

		//สร้าง Group สำหรับ Issues โดยเฉพาะ
		issueGroup := protected.Group("/issues")
		// อนุญาตให้ Admin, Teacher, Student เข้าถึงได้
		issueGroup.Use(middleware.RoleGuard("Admin", "Teacher", "Student"))
		{
			issueGroup.GET("", issues.GetIssueReports)        // GET /issues (List)
			issueGroup.POST("", issues.CreateIssue)           // POST /issues (Create)
			issueGroup.GET("/:id", issues.GetIssueReportByID) // GET /issues/:id (Get By ID)
			issueGroup.GET("/my", issues.GetMyIssues)         // GET /issues/my (Get My Issues)
		}

		protected.POST("/logout", authHandler.Logout)
	}

	r.Run(":8080")
}
