package mockdata

import (
	"github.com/sut68/team07/backend/config"
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

var MockUser = []entity.User{
	{Username: "Admin@sut.ac.th", Password: config.HashPassword("1234"), Firstname: "Admin", Lastname: "Security", Email: "Admin123@gmail.com", Phone: "0884567898", Pass: false, GenderID: 1, BranchID: 1, RoleID: 1, StatusID: 1},
	{Username: "Teacher1@sut.ac.th", Password: config.HashPassword("5869"), Firstname: "Teacher1", Lastname: "One", Email: "Teacher1@gmail.com", Phone: "0884567891", Pass: false, GenderID: 2, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher2@sut.ac.th", Password: config.HashPassword("8975"), Firstname: "Teacher2", Lastname: "two", Email: "Teacher2@gmail.com", Phone: "0696543214", Pass: false, GenderID: 1, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher3@sut.ac.th", Password: config.HashPassword("1236"), Firstname: "Teacher3", Lastname: "three", Email: "Teacher3@gmail.com", Phone: "0359874658", Pass: false, GenderID: 1, BranchID: 1, RoleID: 2, StatusID: 1},
}
