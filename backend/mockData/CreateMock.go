package mockdata

import (
	"github.com/sut68/team07/backend/entity"
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
	{Status: "Suspended"},
}
var MockIssueStatus = []entity.IssueStatus{
	{Status: "Completed"},
	{Status: "In Progress"},
	{Status: "Pending"},
}

var MockIssueType = []entity.IssueType{
	{Type: "Bug"},
	{Type: "Feature Request"},
	{Type: "Other"},
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
	{ActionType: "UpdateUserStatus"},
	{ActionType: "UpdateGroupStatus"},
	{ActionType: "CreateUser"},
	{ActionType: "UpdateUser"},
	{ActionType: "DeleteUser"},
	{ActionType: "CreateIssue"},
	{ActionType: "UpdateIssue"},
	{ActionType: "DeleteIssue"},
}

func Uint(v uint) *uint { return &v }

var MockGroupProject = []entity.GroupProject{
	{GroupNumber: 1, Year: 2568, GroupStatus: "Pending", Membership: 5, TeacherID: Uint(2)},
	{GroupNumber: 2, Year: 2568, GroupStatus: "Pending", Membership: 5, TeacherID: Uint(2)},
	{GroupNumber: 3, Year: 2568, GroupStatus: "Pending", Membership: 5, TeacherID: Uint(3)},
	{GroupNumber: 4, Year: 2568, GroupStatus: "Pending", Membership: 5, TeacherID: Uint(4)},
	{GroupNumber: 5, Year: 2568, GroupStatus: "Pending", Membership: 5, TeacherID: Uint(5)},
	{GroupNumber: 6, Year: 2568, GroupStatus: "Pending", Membership: 3, TeacherID: Uint(6)},
}

var MockGroupMember = []entity.GroupMember{
	{Leader: true, StudentID: 12, GroupProjectID: 1},
	{Leader: true, StudentID: 13, GroupProjectID: 1},
	{Leader: false, StudentID: 14, GroupProjectID: 2},
	{Leader: true, StudentID: 16, GroupProjectID: 2},
	{Leader: true, StudentID: 15, GroupProjectID: 3},

	{Leader: false, StudentID: 17, GroupProjectID: 3},
	{Leader: false, StudentID: 18, GroupProjectID: 3},
	{Leader: false, StudentID: 19, GroupProjectID: 4},
	{Leader: true, StudentID: 20, GroupProjectID: 4},
	{Leader: false, StudentID: 21, GroupProjectID: 5},
	{Leader: true, StudentID: 22, GroupProjectID: 5},
	{Leader: false, StudentID: 23, GroupProjectID: 6},
	{Leader: false, StudentID: 24, GroupProjectID: 6},
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
		GroupProjectID: nil, // อาจารย์เพิ่มก่อน ยังไม่มีกลุ่ม
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
		TeacherID:      Uint(3),
	},
	{
		Title:       "Renewable Energy",
		Objective:   "Designing a hybrid solar-wind energy system.",
		Scope:       "Solar panels, wind turbines, energy storage, grid integration",
		Description: "Hybrid solar-wind energy system design",
		Status:      "Approved",

		ProposerRole:   "Student",
		GroupProjectID: Uint(4),
		TeacherID:      Uint(4),
	},
	{
		Title:       "Health Monitoring",
		Objective:   "Creating a wearable device for health tracking.",
		Scope:       "Wearable sensors, mobile app, cloud data storage, health analytics",
		Description: "Wearable health tracking device",
		Status:      "Approved",

		ProposerRole:   "Student",
		GroupProjectID: Uint(5),
		TeacherID:      Uint(5),
	},
	{
		Title:       "Smart Home Automation",
		Objective:   "Implementing an IoT-based home automation system.",
		Scope:       "Smart devices, central controller, mobile app, voice control",
		Description: "IoT-based home automation system",
		Status:      "Approved",

		ProposerRole:   "Student",
		GroupProjectID: Uint(6),
		TeacherID:      Uint(6),
	},
}
