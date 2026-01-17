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

var MockGroup_member = []entity.GroupMember{
	{GroupProjectID: 1, StudentID: 12, Leader: true},
	{GroupProjectID: 1, StudentID: 13, Leader: false},
	{GroupProjectID: 1, StudentID: 14, Leader: false},

	{GroupProjectID: 2, StudentID: 15, Leader: true},
	{GroupProjectID: 2, StudentID: 16, Leader: false},
	{GroupProjectID: 2, StudentID: 17, Leader: false},
	
	{GroupProjectID: 3, StudentID: 18, Leader: true},
	{GroupProjectID: 3, StudentID: 19, Leader: false},
	{GroupProjectID: 3, StudentID: 20, Leader: false},

	{GroupProjectID: 4, StudentID: 21, Leader: true},
	{GroupProjectID: 4, StudentID: 22, Leader: false},
	{GroupProjectID: 4, StudentID: 23, Leader: false},
}

func UintPtr(n uint) *uint {
	return &n
}

var MockGroup_project = []entity.GroupProject{
	{GroupNumber: 1, GroupStatus: "Completed", Year: 2568, Membership: 3, TeacherID: UintPtr(2)},
	{GroupNumber: 2, GroupStatus: "Completed", Year: 2568, Membership: 3, TeacherID: UintPtr(2)},
	{GroupNumber: 3, GroupStatus: "Completed", Year: 2568, Membership: 3, TeacherID: UintPtr(3)},
	{GroupNumber: 4, GroupStatus: "Completed", Year: 2568, Membership: 3, TeacherID: UintPtr(3)},
}