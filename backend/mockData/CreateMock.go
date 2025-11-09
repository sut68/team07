package mockdata

import "github.com/sut68/team07/backend/entity"

var MockGender = []entity.Gender{
	{Name: "Male"},
	{Name: "Female"},
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

var MockUser = []entity.User{
	{Username: "admin", Password: "1234",StatusID:1 , RoleID: 1},
	{Username: "teacher1", Password: "5678",StatusID:1, RoleID: 2},
	{Username: "B6666666", Password: "9012",StatusID:1, RoleID: 3},
	{Username: "B7777777", Password: "1209",StatusID:2, RoleID: 3},
}

var MockTeacher = []entity.TeacherInfo{
	{Firstname: "Wichai", Lastname: "Micro", Email: "Vegita@sut.ac.th",Major: "CPE", Phone: "0812345678",UserID: 2,GenderID: 1},
}

var MockGroup = []entity.Group{
	{ProjectName: "TNT",TeacherID: 1,ProjectID: 1},
	{ProjectName: "BOMB",TeacherID: 1,ProjectID: 2},
}

var MockStudent = []entity.StudentInfo{
	{Firstname: "Thonton", Lastname: "NeverDIE", Email: "B6666666@sut.ac.th",Major: "CPE", Phone: "0988877766",GenderID: 2,UserID: 3,GroupID: 1},
	{Firstname: "Somsuk", Lastname: "DieTWICE", Email: "B7777777@sut.ac.th",Major: "CPE", Phone: "0678974561",GenderID: 1,UserID: 4,GroupID: 2},
}