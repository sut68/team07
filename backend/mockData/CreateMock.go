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
	{Type: "Security"},
	{Type: "Other"},
}

var MockActionType = []entity.ActionType{
	{ActionType: "Created"},               // 1
	{ActionType: "Update"},                // 2
	{ActionType: "Delete"},                // 3
	{ActionType: "GetAllProGress"},        // 4
	{ActionType: "InsertProGress"},        // 5
	{ActionType: "UpdateProGress"},        // 6
	{ActionType: "DeleteProGress"},        // 7
	{ActionType: "GetMessege"},            // 8
	{ActionType: "SendMessege"},           // 9
	{ActionType: "DeleteMessege"},         // 10
	{ActionType: "Login"},                 // 11
	{ActionType: "Logout"},                // 12
	{ActionType: "ResetPassword"},         // 13
	{ActionType: "DeleteAppointment"},     // 14
	{ActionType: "CreateAppointment"},     // 15
	{ActionType: "UpdateAppointment"},     // 16
	{ActionType: "CreateRoom"},            // 17
	{ActionType: "CreateAppointmentType"}, // 18
	{ActionType: "DeleteAppointmentType"}, // 19
	{ActionType: "SaveEvaluation"},        // 20
	{ActionType: "CreateCriteria"},        // 21
	{ActionType: "DeleteCriteria"},        // 22
	{ActionType: "UpdateCriteria"},        // 23
	{ActionType: "CreateCriteriaLevel"},   // 24
	{ActionType: "DeleteCriteriaLevel"},   // 25
	{ActionType: "UpdateCriteriaLevel"},   // 26
	{ActionType: "UpdateUserStatus"},      // 27
	{ActionType: "UpdateGroupStatus"},     // 28
	{ActionType: "CreateUser"},            // 29
	{ActionType: "UpdateUser"},            // 30
	{ActionType: "DeleteUser"},            // 31
	{ActionType: "CreateIssue"},           // 32
	{ActionType: "UpdateIssue"},           // 33
	{ActionType: "DeleteIssue"},           // 34
	{ActionType: "SaveAdvisorSelection"},  // 35
	{ActionType: "RejectRequest"},         // 36
	{ActionType: "ToggleAdvisorStatus"},   // 37
	{ActionType: "GenerateGroups"},        // 38
	{ActionType: "AddMemberToGroup"},      // 39
	{ActionType: "RemoveMemberFromGroup"}, // 40
	{ActionType: "ChangeLeader"},          // 41
	{ActionType: "DeleteGroup"},           // 42
	{ActionType: "UpdateGroupAdvisor"},    // 43
	{ActionType: "CreateNews"},            // 44
	{ActionType: "UpdateNews"},            // 45
	{ActionType: "DeleteNews"},            // 46
	{ActionType: "ImportUsers"},           // 47
	{ActionType: "CreateProject"},         // 48
	{ActionType: "UpdateProject"},         // 49
	{ActionType: "DeleteProject"},         // 50
	{ActionType: "CreateTopic"},           // 51
	{ActionType: "UpdateTopic"},           // 52
	{ActionType: "DeleteTopic"},           // 53
	{ActionType: "ApproveTopic"},          // 54
	{ActionType: "SelectTopic"},           // 55
	{ActionType: "CancelSelection"},       // 56
}

func Uint(v uint) *uint { return &v }

// var MockGroupProject = []entity.GroupProject{
// 	{GroupNumber: 1, Year: 2568, GroupStatus: "Pending", Membership: 5, TeacherID: Uint(2)},
// 	{GroupNumber: 2, Year: 2568, GroupStatus: "Pending", Membership: 5, TeacherID: Uint(2)},
// 	{GroupNumber: 3, Year: 2568, GroupStatus: "Pending", Membership: 5, TeacherID: Uint(3)},
// 	{GroupNumber: 4, Year: 2568, GroupStatus: "Pending", Membership: 5, TeacherID: Uint(4)},
// 	{GroupNumber: 5, Year: 2568, GroupStatus: "Pending", Membership: 5, TeacherID: Uint(5)},
// 	{GroupNumber: 6, Year: 2568, GroupStatus: "Pending", Membership: 3, TeacherID: Uint(6)},
// }

// var MockGroupMember = []entity.GroupMember{
// 	{Leader: true, StudentID: 12, GroupProjectID: 1},
// 	{Leader: false, StudentID: 13, GroupProjectID: 1},
// 	{Leader: true, StudentID: 14, GroupProjectID: 2},
// 	{Leader: false, StudentID: 16, GroupProjectID: 2},
// 	{Leader: true, StudentID: 15, GroupProjectID: 3},

// 	{Leader: false, StudentID: 17, GroupProjectID: 3},
// 	{Leader: false, StudentID: 18, GroupProjectID: 3},
// 	{Leader: true, StudentID: 19, GroupProjectID: 4},
// 	{Leader: false, StudentID: 20, GroupProjectID: 4},
// 	{Leader: true, StudentID: 21, GroupProjectID: 5},
// 	{Leader: false, StudentID: 22, GroupProjectID: 5},
// 	{Leader: true, StudentID: 23, GroupProjectID: 6},
// 	{Leader: false, StudentID: 24, GroupProjectID: 6},
// }

// var MockTopics = []entity.Topic{
// 	{
// 		Title:       "Smart Farm System",
// 		Objective:   "Develop an automated IoT system to monitor and control environmental parameters for vegetable farming.",
// 		Scope:       "Sensor network, data collection, irrigation control, web dashboard",
// 		Description: "Automated IoT system for vegetable farming",
// 		Status:      "Approved",

// 		ProposerRole:   "Student",
// 		GroupProjectID: Uint(1),
// 		TeacherID:      Uint(2),
// 	},
// 	{
// 		Title:       "AI Face Recognition Attendance",
// 		Objective:   "Build an attendance system using face recognition to automate check-in/out.",
// 		Scope:       "Face detection, recognition model, camera integration, attendance DB",
// 		Description: "Check-in system using camera and AI",
// 		Status:      "Approved",

// 		ProposerRole:   "Teacher",
// 		GroupProjectID: nil, // อาจารย์เพิ่มก่อน ยังไม่มีกลุ่ม
// 		TeacherID:      Uint(2),
// 	},
// 	{
// 		Title:       "E-Commerce Mobile Application",
// 		Objective:   "Create a mobile shopping app with product listing, cart and payment integration.",
// 		Scope:       "Mobile frontend, backend API, payment gateway, order management",
// 		Description: "Online shopping app with payment gateway",
// 		Status:      "Approved",

// 		ProposerRole:   "Student",
// 		GroupProjectID: Uint(3),
// 		TeacherID:      Uint(3),
// 	},
// 	{
// 		Title:       "Renewable Energy",
// 		Objective:   "Designing a hybrid solar-wind energy system.",
// 		Scope:       "Solar panels, wind turbines, energy storage, grid integration",
// 		Description: "Hybrid solar-wind energy system design",
// 		Status:      "Approved",

// 		ProposerRole:   "Student",
// 		GroupProjectID: Uint(4),
// 		TeacherID:      Uint(4),
// 	},
// 	{
// 		Title:       "Health Monitoring",
// 		Objective:   "Creating a wearable device for health tracking.",
// 		Scope:       "Wearable sensors, mobile app, cloud data storage, health analytics",
// 		Description: "Wearable health tracking device",
// 		Status:      "Approved",

// 		ProposerRole:   "Student",
// 		GroupProjectID: Uint(5),
// 		TeacherID:      Uint(5),
// 	},
// 	{
// 		Title:       "Smart Home Automation",
// 		Objective:   "Implementing an IoT-based home automation system.",
// 		Scope:       "Smart devices, central controller, mobile app, voice control",
// 		Description: "IoT-based home automation system",
// 		Status:      "Approved",

// 		ProposerRole:   "Student",
// 		GroupProjectID: Uint(6),
// 		TeacherID:      Uint(6),
// 	},
// }
