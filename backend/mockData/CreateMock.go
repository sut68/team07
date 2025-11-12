package mockdata

import "github.com/sut68/team07/backend/entity"

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
var MockAcountStatus = []entity.AccountStatus{
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
	{ActionType: "Create"},
	{ActionType: "Update"},
	{ActionType: "Delete"},
}