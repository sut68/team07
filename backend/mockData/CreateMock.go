package mockdata

import (
	"time"

	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/service"
)


var MockGender = []entity.Gender{
	{Name: "Male"},
	{Name: "Female"},
}
var MockBranch = []entity.Branch{
	{BranchName: "Computer Engineering"},
	{BranchName: "Electrical Engineering"},
	{BranchName: "Mechanical Engineering"},
}

var MockRole = []entity.UserRole{
	{Role: "Admin"},
	{Role: "Teacher"},
	{Role: "Student"},
}
var MockAccountStatus = []entity.AccountStatus{
	{Status: "Active"},
	{Status: "Inactive"},
}
var MockIssueStatus = []entity.IssueStatus{
	{Status: "Completed"},
	{Status: "In Progress"},
	{Status: "Pending"},
}

var MockIssueType = []entity.IssueType{
	{Type: "Bug"},
	{Type: "Feature Request"},
}

var MockActionType = []entity.ActionType{
	{ActionType: "Created"},
	{ActionType: "Update"},
	{ActionType: "Delete"},
	{ActionType: "GetAllProGress"},
	{ActionType: "InsertProGress"},
	{ActionType: "UpdateProGress"},
	{ActionType: "DeleteProGress"},
	{ActionType: "GetMessege"},
	{ActionType: "SendMessege"},
	{ActionType: "DeleteMessege"},
	{ActionType: "Login"},
	{ActionType: "Logout"},
	{ActionType: "ResetPassword"},
	{ActionType: "DeleteAppointment"},
	{ActionType: "CreateAppointment"},
	{ActionType: "UpdateAppointment"},
	{ActionType: "CreateRoom"},
	{ActionType: "CreateAppointmentType"},
	{ActionType: "DeleteAppointmentType"},
	{ActionType: "SaveEvaluation"},
	{ActionType: "CreateCriteria"},
	{ActionType: "DeleteCriteria"},
	{ActionType: "UpdateCriteria"},
	{ActionType: "CreateCriteriaLevel"},
	{ActionType: "DeleteCriteriaLevel"},
	{ActionType: "UpdateCriteriaLevel"},
}

var (
	passTrue = true
	passFalse= false
	passNull  *bool = nil
)
var jwtService = service.NewJwtService()

var MockUser = []entity.User{
	{Username: "Admin@sut.ac.th", Password: jwtService.HashPassword("adm123"), Firstname: "Admin", Lastname: "Security", Email: "pthanathonhodon@gmail.com", Phone: "09622934415", Pass: passNull, GenderID: 1, BranchID: 1, RoleID: 1, StatusID: 1},
	{Username: "Teacher1@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Teacher1", Lastname: "One", Email: "Teacher1@gmail.com", Phone: "0884567891", Pass: passNull, GenderID: 2, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher2@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Teacher2", Lastname: "Two", Email: "Teacher2@gmail.com", Phone: "0696543214", Pass: passNull, GenderID: 1, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher3@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Teacher3", Lastname: "Three", Email: "Teacher3@gmail.com", Phone: "0359874658", Pass: passNull, GenderID: 1, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher4@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Teacher4", Lastname: "Four", Email: "Teacher4@gmail.com", Phone: "0977890123", Pass: passNull, GenderID: 2, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher5@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Teacher5", Lastname: "Five", Email: "Teacher5@gmail.com", Phone: "0988901234", Pass: passNull, GenderID: 1, BranchID: 2, RoleID: 2, StatusID: 1},
	{Username: "B6500001@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student1", Lastname: "Chanakul", Email: "Student1@gmail.com", Phone: "0911234567", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500002@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student2", Lastname: "Wattanapong", Email: "Student2@gmail.com", Phone: "0922345678", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500003@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student3", Lastname: "Sirilak", Email: "Student3@gmail.com", Phone: "0933456789", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500004@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student4", Lastname: "Thammasak", Email: "Student4@gmail.com", Phone: "0944567890", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500005@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student5", Lastname: "Chansuda", Email: "Student5@gmail.com", Phone: "0955678901", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500006@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student6", Lastname: "Kittipong", Email: "Student6@gmail.com", Phone: "0966789012", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500007@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student7", Lastname: "Maneerat", Email: "Student7@gmail.com", Phone: "0977890123", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500008@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student8", Lastname: "Phonchai", Email: "Student8@gmail.com", Phone: "0988901234", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500009@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student9", Lastname: "Nanthika", Email: "Student9@gmail.com", Phone: "0999012345", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500010@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student10", Lastname: "Worawit", Email: "Student10@gmail.com", Phone: "0800123456", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500011@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student11", Lastname: "Pannapa", Email: "Student11@gmail.com", Phone: "0811234567", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 2},
	{Username: "B6500012@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student12", Lastname: "Thammarat", Email: "Student12@gmail.com", Phone: "0822345678", Pass: &passTrue, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 2},
	{Username: "B6500013@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student13", Lastname: "Kamonwan", Email: "Student13@gmail.com", Phone: "0833456789", Pass: &passTrue, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 2},
	{Username: "B6500014@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student14", Lastname: "Suphachai", Email: "Student14@gmail.com", Phone: "0844567890", Pass: &passTrue, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 2},
}

func Uint(v uint) *uint { return &v }

var MockGroupProject = []entity.GroupProject{
	{GroupNumber: 1, Year: 2568, GroupStatus: "In Process", Membership: 5, TeacherID: Uint(2)},
	{GroupNumber: 2, Year: 2568, GroupStatus: "Pending", Membership: 5, TeacherID: Uint(2)},
	{GroupNumber: 3, Year: 2568, GroupStatus: "Completed", Membership: 5, TeacherID: Uint(3)},
	{GroupNumber: 4, Year: 2568, GroupStatus: "In Process", Membership: 5, TeacherID: Uint(4)},
	{GroupNumber: 5, Year: 2568, GroupStatus: "Pending", Membership: 5, TeacherID: Uint(5)},
	{GroupNumber: 6, Year: 2568, GroupStatus: "Pending", Membership: 3, TeacherID: Uint(6)},
}

var MockGroupMember = []entity.GroupMember{
	{Leader: true, StudentID: 7, GroupProjectID: 1},
	{Leader: true, StudentID: 8, GroupProjectID: 4},
	{Leader: false, StudentID: 9, GroupProjectID: 1},
	{Leader: true, StudentID: 11, GroupProjectID: 2},
	{Leader: true, StudentID: 10, GroupProjectID: 3},

	{Leader: false, StudentID: 12, GroupProjectID: 2},
	{Leader: false, StudentID: 13, GroupProjectID: 3},
	{Leader: false, StudentID: 14, GroupProjectID: 4},
	{Leader: true, StudentID: 15, GroupProjectID: 5},
	{Leader: false, StudentID: 16, GroupProjectID: 5},
	{Leader: true, StudentID: 17, GroupProjectID: 6},
}

var MockTopics = []entity.Topic{
	{
		Title:       "Smart Farm System",
		Objective:   "Develop an automated IoT system to monitor and control environmental parameters for vegetable farming.",
		Scope:       "Sensor network, data collection, irrigation control, web dashboard",
		Description: "Automated IoT system for vegetable farming",
		Status:      "Approved",

		ProposerRole:   "Student",
		GroupProjectID: Uint(1),
		TeacherID:      Uint(2),
	},
	{
		Title:       "AI Face Recognition Attendance",
		Objective:   "Build an attendance system using face recognition to automate check-in/out.",
		Scope:       "Face detection, recognition model, camera integration, attendance DB",
		Description: "Check-in system using camera and AI",
		Status:      "Approved",

		ProposerRole:   "Teacher",
		GroupProjectID: nil,          // อาจารย์เพิ่มก่อน ยังไม่มีกลุ่ม
		TeacherID:      Uint(2),
	},
	{
		Title:       "E-Commerce Mobile Application",
		Objective:   "Create a mobile shopping app with product listing, cart and payment integration.",
		Scope:       "Mobile frontend, backend API, payment gateway, order management",
		Description: "Online shopping app with payment gateway",
		Status:      "Approved",

		ProposerRole:   "Student",
		GroupProjectID: Uint(3),
		TeacherID:      Uint(2),
	},
}


var MockTopicSelections = []entity.TopicSelection{
	{DateSelected:time.Now().AddDate(0, -4, 0),TopicID: 1,GroupProjectID: 1,},
	{DateSelected:time.Now().AddDate(0, -4, 0),TopicID: 2,GroupProjectID: 2,},
	{DateSelected:time.Now().AddDate(0, -4, 0),TopicID: 3,GroupProjectID: 3,},
	{DateSelected:time.Now().AddDate(0, -3, 0),TopicID: 4,GroupProjectID: 4,},
	{DateSelected:time.Now().AddDate(0, -3, 0),TopicID: 5,GroupProjectID: 5,},
	{DateSelected:time.Now().AddDate(0, -2, 0),TopicID: 6,GroupProjectID: 6,},
}

var MockProjects = []entity.Project{
	{Title:"Complete Report: Smart Farm System",Abstract: "This project aims to develop an IOT solution...",Keywords: "IOT, Smart Farm, Arduino",Year: 2025,Status:"Completed",FilePath: "/uploads/projects/group1_final.pdf",SelectionID: 1,},
	{Title:"Complete Report: AI Face Recognition",Abstract: "A system to automate attendance tracking...",Keywords: "AI, Computer Vision, Python",Year: 2025,Status:"Completed",FilePath: "/uploads/projects/group2_final.pdf",SelectionID: 2,},
	{Title:"Complete Report: E-Commerce App",Abstract: "Development of a mobile application...",Keywords: "E-Commerce, Mobile App, Flutter",Year: 2025,Status:"In Progress",FilePath: "/uploads/projects/group3_draft.pdf",SelectionID: 3,},
	{Title:"Complete Report: Renewable Energy",Abstract: "Designing a hybrid solar-wind energy system...",Keywords: "Renewable Energy, Solar, Wind",Year: 2025,Status:"Pending",FilePath: "",SelectionID: 4,},
	{Title:"Complete Report: Health Monitoring",Abstract: "Creating a wearable device for health tracking...",Keywords: "Wearable, Health Monitoring, IoT",Year: 2025,Status:"Pending",FilePath: "",SelectionID: 5,},
	{Title:"Complete Report: Smart Home Automation",Abstract: "Implementing an IoT-based home automation system...",Keywords: "Smart Home, IoT, Automation",Year: 2025,Status:"Pending",FilePath: "",SelectionID: 6,},
}

