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
	{Username: "Student1@sut.ac.th", Password: config.HashPassword("std123"), Firstname: "Student1", Lastname: "A", Email: "Student1@gmail.com", Phone: "0911234567", Pass: false, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "Student2@sut.ac.th", Password: config.HashPassword("std456"), Firstname: "Student2", Lastname: "B", Email: "Student2@gmail.com", Phone: "0922345678", Pass: false, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "Student3@sut.ac.th", Password: config.HashPassword("std789"), Firstname: "Student3", Lastname: "C", Email: "Student3@gmail.com", Phone: "0933456789", Pass: false, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "Student4@sut.ac.th", Password: config.HashPassword("std012"), Firstname: "Student4", Lastname: "D", Email: "Student4@gmail.com", Phone: "0944567890", Pass: false, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "Student5@sut.ac.th", Password: config.HashPassword("std345"), Firstname: "Student5", Lastname: "E", Email: "Student5@gmail.com", Phone: "0955678901", Pass: false, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "Student6@sut.ac.th", Password: config.HashPassword("std678"), Firstname: "Student6", Lastname: "F", Email: "Student6@gmail.com", Phone: "0966789012", Pass: false, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
}
