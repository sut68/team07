package main

import (
	"os"
	"path/filepath"
	"fmt"
	"log"
	"runtime"
	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/advisor"
	"github.com/sut68/team07/backend/controller/appointment"
	"github.com/sut68/team07/backend/controller/auth"
	"github.com/sut68/team07/backend/controller/chat"
	"github.com/sut68/team07/backend/controller/evaluation"
	filter "github.com/sut68/team07/backend/controller/filter/code"
	"github.com/sut68/team07/backend/controller/group"
	"github.com/sut68/team07/backend/controller/issues"
	"github.com/sut68/team07/backend/controller/news"
	"github.com/sut68/team07/backend/controller/progress"
	"github.com/sut68/team07/backend/controller/project"
	"github.com/sut68/team07/backend/controller/storage"
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

	// เช็คคำสั่ง Seed (แก้ให้รองรับทั้ง --seed และ seed)
	if len(os.Args) > 1 && (os.Args[1] == "--seed" || os.Args[1] == "seed") {
		fmt.Println("FOUND SEED COMMAND: Starting Seeding Process...")
		Data := database.DB()
		if Data == nil {
			fmt.Println("ERROR: Database Connection is NIL")
			return
		}
		mockdata.InsertMock(Data)
		fmt.Println("SEED COMPLETED: Data should be in DB now.")
		return
	}
	service.InitEmailConfig()
	service.StartCleanupWorker(database.DB())
	r := gin.Default()
	r.Use(database.CORSMiddleware())
	r.Static("/uploads", "./uploads")

	cwd, _ := os.Getwd()

	libName := "onnxruntime.dll"
	if runtime.GOOS == "linux" {
		libName = "onnxruntime.so"
	}

    spamCtrl, err := filter.NewSpamController(
        filepath.Join(cwd, "controller", "filter", "data", "gambling.onnx"),
        filepath.Join(cwd, "controller", "filter", "data", "gambling_meta.json"),
        filepath.Join(cwd, "lib", libName),           
    )
	if err != nil {
		log.Printf("⚠️ Warning: Failed to initialize Spam Controller: %v", err)
	}

	authHandler := auth.NewLoginHandler()

	r.POST("/login", authHandler.Login)
	r.POST("/refresh", authHandler.Refresh)
	r.POST("/forgot-password", authHandler.ForgotPassword)
	r.POST("/reset-password", authHandler.ResetPassword)

	if spamCtrl != nil {
		r.POST("/checkspam", spamCtrl.CheckSpam)
	}
	//r.Static("/chatsave", "./chatsave") ย้ายไปใช้ uploads แทน
	// Backward compatibility for old chat images
	r.Static("/chatsave", "./uploads/chats")

	protected := r.Group("/")
	protected.Use(middleware.CSRFCheckMiddleware(), middleware.AuthMiddleware())
	{

		// user ทุก Role สามารถเข้าถึงได้

		//protected.POST("/checkspam", spamCtrl.CheckSpam)// pls fix it on docker also

		protected.GET("/GetChat", chat.GetAllChat)
		protected.GET("/get_teacher_id", chat.GetGroupbyteacherid)
		protected.POST("/SendChat", chat.InsertChat)
		protected.DELETE("/DeleteChat", chat.DeleteChat)
		protected.DELETE("/Deletechatbyid", chat.DeleteChatbyProgress)

		protected.GET("/getUserProfile", users.GetUserProfile)
		protected.PATCH("/updateUserProfile", users.UpdateUserProfile)
		protected.GET("/me", authHandler.Me)

		protected.GET("/getProcess", progress.GetProGressByID)
		protected.GET("/getProjectbyuser", progress.GetGroupProjectIDByStudentID)
		protected.POST("/assignProgress", progress.AssignProGress)
		protected.POST("/modifyProgress", progress.UpdateProGress)
		protected.DELETE("/deleteProgress", progress.DeleteProgress)

		// News
		protected.POST("/news", news.CreateNews)
		protected.GET("/news", news.GetNews)
		protected.PATCH("/news/:id", news.UpdateNews)
		protected.DELETE("/news/:id", news.DeleteNews)

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

			adminGroup.POST("/importUsersCSV", users.ImportUsersCSV)
			adminGroup.PATCH("/issues/:id", issues.UpdateIssueStatus)
			adminGroup.GET("/users", users.ListUsers)
			adminGroup.POST("/user", users.CreateUser)
			adminGroup.PATCH("/user/:id", users.UpdateUser)
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
			// == Storage ===========================
			teacherGroup.GET("/storage/projects", storage.ListProjects)
			teacherGroup.GET("/storage/projects/:id", storage.GetProject)
			teacherGroup.POST("/storage/projects", storage.CreateProject)
			teacherGroup.PATCH("/storage/projects/:id", storage.UpdateProject)
			teacherGroup.DELETE("/storage/projects/:id", storage.DeleteProject)
			// Status Update
			teacherGroup.PATCH("/groups/:id/status", updateStatus.UpdateGroupStatus)

			// Select Group Advisor
			teacherGroup.GET("/requests", advisor.GetAdvisorRequests)
			teacherGroup.POST("/request/accept", advisor.AcceptRequest)
			teacherGroup.POST("/request/reject", advisor.RejectRequest)
			teacherGroup.POST("/status/toggle", advisor.ToggleAdvisorStatus)
		}

		studentGroup := protected.Group("/student")
		studentGroup.Use(middleware.RoleGuard("Student"))
		{
			// ถ้า API ไหนที่นักเรียนเข้าถึงได้ ให้นำไปใส่ในนี้
			studentGroup.GET("/getProcess", progress.GetProGressByID)
			studentGroup.GET("/getProjectbyuser", progress.GetGroupProjectIDByStudentID)
			studentGroup.POST("/assignProgress", progress.AssignProGress)
			studentGroup.POST("/modifyProgress", progress.UpdateProGress)
			studentGroup.DELETE("/deleteProgress", progress.DeleteProgress)

			// Group
			//studentGroup.GET("/group", group.GetGroupProject)
			studentGroup.GET("/myGroup", group.GetMyGroup)
			studentGroup.POST("/addMember", group.PostGroupMember)

			//Select Advisor
			studentGroup.POST("/select", advisor.SaveAdvisorSelection)
			studentGroup.GET("/selection/:groupId", advisor.GetAdvisorSelection)
			studentGroup.GET("/teachers/search", advisor.GetAllTeachers)

			// Evaluation and Appointment
			studentGroup.GET("/myAppointment", appointment.GetMyProjectAndAppointment)
			studentGroup.GET("/evaluation/form", evaluation.GetStudentEvaluationForm)
			studentGroup.GET("/evaluation/result", evaluation.GetStudentEvaluationResult)
			studentGroup.POST("/evaluation/peer", evaluation.SavePeerEvaluation)

			// Topic Selection
			studentGroup.GET("/topic", topic.GetStudentTopic)
			studentGroup.POST("/topics/:id/select", topic.SelectTopic)
			studentGroup.POST("/topics/cancel-selection", topic.CancelSelection)

			// Storage (Read-only for students)
			studentGroup.GET("/storage/projects", storage.ListProjectsStudent)
			studentGroup.GET("/storage/projects/:id", storage.GetProjectStudent)

			// Project Information
			studentGroup.POST("/project", project.CreateProject)
			studentGroup.GET("/project", project.GetMyProject)
			studentGroup.PATCH("/project/:id", project.UpdateProject)
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
