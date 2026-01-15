package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/sut68/team07/backend/controller/advisor"
	"github.com/sut68/team07/backend/controller/appointment"
	"github.com/sut68/team07/backend/controller/auth"
	"github.com/sut68/team07/backend/controller/chat"
	"github.com/sut68/team07/backend/controller/evaluation"
	filter "github.com/sut68/team07/backend/controller/filter/code"
	"github.com/sut68/team07/backend/controller/group"
	"github.com/sut68/team07/backend/controller/issues"
	"github.com/sut68/team07/backend/controller/news"
	"github.com/sut68/team07/backend/controller/notification"
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

	endpoint := os.Getenv("MINIO_ENDPOINT")
	if endpoint == "" {
		endpoint = "minio:9000"
	}
	accessKey := os.Getenv("MINIO_ROOT_USER")
	if accessKey == "" {
		accessKey = "admin"
	}
	secretKey := os.Getenv("MINIO_ROOT_PASSWORD")
	if secretKey == "" {
		secretKey = "install123"
	}

	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: false,
	})
	if err != nil {
		log.Printf("Warning: MinIO init failed: %v", err)
	}

	envSecurity := os.Getenv("ENV_SECURITY")
	if envSecurity == "" {
		envSecurity = "team07api"
	}

	apiGroup := r.Group("/" + envSecurity)

	apiGroup.GET("/storage/:bucket/*object", func(c *gin.Context) {
		if minioClient == nil {
			c.Status(503)
			return
		}

		bucket := c.Param("bucket")
		objectName := strings.TrimPrefix(c.Param("object"), "/")
		if objectName == "" {
			c.Status(404)
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
		defer cancel()

		obj, err := minioClient.GetObject(ctx, bucket, objectName, minio.GetObjectOptions{})
		if err != nil {
			c.Status(404)
			return
		}
		defer obj.Close()

		st, err := obj.Stat()
		if err != nil {
			c.Status(404)
			return
		}

		ct := st.ContentType
		if ct == "" {
			ct = "application/octet-stream"
		}

		c.DataFromReader(200, st.Size, ct, obj, nil)
	})

	cwd, _ := os.Getwd()

	libName := "libonnxruntime.so"
	if runtime.GOOS == "linux" {
		libName = "libonnxruntime.so"
	}

	spamCtrl, err := filter.NewSpamController(
		filepath.Join(cwd, "controller", "filter", "data", "gambling.onnx"),
		filepath.Join(cwd, "controller", "filter", "data", "gambling_meta.json"),
		filepath.Join(cwd, "lib", libName),
	)
	if err != nil {
		log.Printf("Warning: Failed to initialize Spam Controller: %v", err)
	}

	authHandler := auth.NewLoginHandler()

	apiGroup.POST("/login", authHandler.Login)
	apiGroup.POST("/refresh", authHandler.Refresh)
	apiGroup.POST("/forgot-password", authHandler.ForgotPassword)
	apiGroup.POST("/reset-password", authHandler.ResetPassword)

	// Move static files under the API prefix
	apiGroup.Static("/uploads", "./uploads")
	apiGroup.Static("/chatsave", "./uploads/chats")

	protected := apiGroup.Group("/")
	protected.Use(middleware.CSRFCheckMiddleware(), middleware.AuthMiddleware())
	{

		protected.POST("/checkspam", spamCtrl.CheckSpam)
		protected.GET("/GetChat", chat.GetAllChat)
		protected.GET("/get_teacher_id", chat.GetGroupbyteacherid)
		protected.POST("/SendChat", chat.InsertChat)
		protected.DELETE("/DeleteChat", chat.DeleteChat)
		protected.DELETE("/Deletechatbyid", chat.DeleteChatbyProgress)
		protected.POST("/uploadfile", chat.GetFile)

		protected.GET("/getUserProfile", users.GetUserProfile)
		protected.PATCH("/updateUserProfile", users.UpdateUserProfile)
		protected.GET("/me", authHandler.Me)
		protected.POST("/change-password", authHandler.ChangePassword)

		protected.GET("/getProcess", progress.GetProGressByID)
		protected.GET("/getProjectbyuser", progress.GetGroupProjectIDByStudentID)
		protected.POST("/assignProgress", progress.AssignProGress)
		protected.POST("/modifyProgress", progress.UpdateProGress)
		protected.DELETE("/deleteProgress", progress.DeleteProgress)

		protected.POST("/news", news.CreateNews)
		protected.GET("/news", news.GetNews)
		protected.PATCH("/news/:id", news.UpdateNews)
		protected.DELETE("/news/:id", news.DeleteNews)

		protected.GET("/academicYears", group.GetAcademicYears)
		protected.GET("/group", group.GetGroupProject)
		protected.GET("/notifications/my", notification.GetMyNotifications)
		protected.PATCH("/notifications/:id/read", notification.MarkAsRead)

		adminGroup := protected.Group("/admin")
		adminGroup.Use(middleware.RoleGuard("Admin"))
		{
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
			teacherGroup.GET("/evaluation/projects", evaluation.ListEvaluationProjects)
			teacherGroup.GET("/evaluation/projects/years", evaluation.GetEvaluationProjectYears)
			teacherGroup.GET("/evaluation/form/:appointment_id", evaluation.GetEvaluationForm)
			teacherGroup.GET("/evaluation/result/:appointment_id", evaluation.GetEvaluationResult)
			teacherGroup.GET("/evaluation/summary/:group_project_id", evaluation.GetEvaluationSummary)
			teacherGroup.POST("/evaluation/save", evaluation.SaveEvaluation)
			teacherGroup.POST("/createAppointmentTypes", appointment.CreateAppointmentType)
			teacherGroup.DELETE("/deleteAppointmentTypes/:id", appointment.DeleteAppointmentType)
			teacherGroup.GET("/criteria", evaluation.ListCriteria)
			teacherGroup.GET("/criteria/:id", evaluation.GetCriteria)
			teacherGroup.POST("/createCriteria", evaluation.CreateCriteria)
			teacherGroup.PATCH("/updateCriteria/:id", evaluation.UpdateCriteria)
			teacherGroup.DELETE("/criteria/:id", evaluation.DeleteCriteria)
			teacherGroup.POST("/createCriteriaLevel", evaluation.CreateCriteriaLevel)
			teacherGroup.PATCH("/updateCriteriaLevel/:id", evaluation.UpdateCriteriaLevel)
			teacherGroup.DELETE("/deleteCriteriaLevel/:id", evaluation.DeleteCriteriaLevel)
			teacherGroup.PATCH("/topics/:id/approval", topic.ApproveTopic)
			teacherGroup.GET("/topics", topic.ListTopics)
			teacherGroup.GET("/topics/:id", topic.GetTopic)
			teacherGroup.POST("/topics", topic.CreateTopic)
			teacherGroup.PATCH("/topics/:id", topic.UpdateTopic)
			teacherGroup.DELETE("/topics/:id", topic.DeleteTopic)
			teacherGroup.GET("/storage/projects/pending", storage.ListPendingProjects)
			teacherGroup.POST("/storage/projects/:id/approve", storage.ApproveProject)
			teacherGroup.GET("/storage/projects", storage.ListProjects)
			teacherGroup.GET("/storage/projects/:id", storage.GetProject)
			teacherGroup.POST("/storage/projects", storage.CreateProject)
			teacherGroup.PATCH("/storage/projects/:id", storage.UpdateProject)
			teacherGroup.DELETE("/storage/projects/:id", storage.DeleteProject)
			teacherGroup.PATCH("/groups/:id/status", updateStatus.UpdateGroupStatus)

			teacherGroup.GET("/requests", advisor.GetAdvisorRequests)
			teacherGroup.POST("/request/accept", advisor.AcceptRequest)
			teacherGroup.POST("/request/reject", advisor.RejectRequest)
			teacherGroup.POST("/status/toggle", advisor.ToggleAdvisorStatus)
		}

		studentGroup := protected.Group("/student")
		studentGroup.Use(middleware.RoleGuard("Student"))
		{
			studentGroup.GET("/getProcess", progress.GetProGressByID)
			studentGroup.GET("/getProjectbyuser", progress.GetGroupProjectIDByStudentID)
			studentGroup.POST("/assignProgress", progress.AssignProGress)
			studentGroup.POST("/modifyProgress", progress.UpdateProGress)
			studentGroup.DELETE("/deleteProgress", progress.DeleteProgress)

			studentGroup.GET("/myGroup", group.GetMyGroup)
			studentGroup.POST("/addMember", group.PostGroupMember)

			studentGroup.POST("/select", advisor.SaveAdvisorSelection)
			studentGroup.GET("/selection/:groupId", advisor.GetAdvisorSelection)
			studentGroup.GET("/teachers/search", advisor.GetAllTeachers)

			studentGroup.GET("/myAppointment", appointment.GetMyProjectAndAppointment)
			studentGroup.GET("/evaluation/form", evaluation.GetStudentEvaluationForm)
			studentGroup.GET("/evaluation/result", evaluation.GetStudentEvaluationResult)
			studentGroup.POST("/evaluation/peer", evaluation.SavePeerEvaluation)

			studentGroup.GET("/topic", topic.GetStudentTopic)
			studentGroup.POST("/topics/:id/select", topic.SelectTopic)
			studentGroup.POST("/topics/cancel-selection", topic.CancelSelection)

			studentGroup.GET("/storage/projects", storage.ListProjectsStudent)
			studentGroup.GET("/storage/projects/:id", storage.GetProjectStudent)

			studentGroup.POST("/project", project.CreateProject)
			studentGroup.GET("/project", project.GetMyProject)
			studentGroup.PATCH("/project/:id", project.UpdateProject)
		}

		teacherOrStudentGroup := protected.Group("/groupProject")
		teacherOrStudentGroup.Use(middleware.RoleGuard("Teacher", "Student"))
		{
			teacherOrStudentGroup.GET("/topics", topic.ListTopics)
			teacherOrStudentGroup.GET("/topics/:id", topic.GetTopic)
			teacherOrStudentGroup.POST("/topics", topic.CreateTopic)
			teacherOrStudentGroup.PATCH("/topics/:id", topic.UpdateTopic)
			teacherOrStudentGroup.DELETE("/topics/:id", topic.DeleteTopic)

		}

		issueGroup := protected.Group("/issues")
		issueGroup.Use(middleware.RoleGuard("Admin", "Teacher", "Student"))
		{
			issueGroup.GET("", issues.GetIssueReports)
			issueGroup.POST("", issues.CreateIssue)
			issueGroup.GET("/:id", issues.GetIssueReportByID)
			issueGroup.GET("/my", issues.GetMyIssues)
			issueGroup.PATCH("/:id", issues.UpdateIssueReport)
			issueGroup.GET("/types", issues.GetIssueTypes)
		}

		protected.POST("/logout", authHandler.Logout)
	}

	r.Run(":8080")
}
