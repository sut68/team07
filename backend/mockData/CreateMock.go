package mockdata

import (
	"time"

	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/service"
	"gorm.io/gorm"
)

// Model: gorm.Model{ID: 1} ที่ใส่ไว้เพื่อมหให้ gorm ตัวที่เชื่อมมันรู้

var MockGender = []entity.Gender{
	{Model: gorm.Model{ID: 1}, Name: "Male"},
	{Model: gorm.Model{ID: 2}, Name: "Female"},
}
var MockBranch = []entity.Branch{
	{Model: gorm.Model{ID: 1}, BranchName: "Computer Engineering"},
	{Model: gorm.Model{ID: 2}, BranchName: "Electrical Engineering"},
	{Model: gorm.Model{ID: 3}, BranchName: "Mechanical Engineering"},
}

var MockRole = []entity.UserRole{
	{Model: gorm.Model{ID: 1}, Role: "Admin"},
	{Model: gorm.Model{ID: 2}, Role: "Teacher"},
	{Model: gorm.Model{ID: 3}, Role: "Student"},
}
var MockAcountStatus = []entity.AccountStatus{
	{Model: gorm.Model{ID: 1}, Status: "Active"},
	{Model: gorm.Model{ID: 2}, Status: "Inactive"},
}
var MockIssueStatus = []entity.IssueStatus{
	{Model: gorm.Model{ID: 1}, Status: "Completed"},
	{Model: gorm.Model{ID: 2}, Status: "In Progress"},
	{Model: gorm.Model{ID: 3}, Status: "Pending"},
}

var MockIssueType = []entity.IssueType{
	{Model: gorm.Model{ID: 1}, Type: "Bug"},
	{Model: gorm.Model{ID: 2}, Type: "Feature Request"},
}

var MockActionType = []entity.ActionType{
	{Model: gorm.Model{ID: 1}, ActionType: "Created"},
	{Model: gorm.Model{ID: 2}, ActionType: "Update"},
	{Model: gorm.Model{ID: 3}, ActionType: "Delete"},
	{Model: gorm.Model{ID: 4}, ActionType: "GetAllProGress"},
	{Model: gorm.Model{ID: 5}, ActionType: "InsertProGress"},
	{Model: gorm.Model{ID: 6}, ActionType: "UpdateProGress"},
	{Model: gorm.Model{ID: 7}, ActionType: "DeleteProGress"},
	{Model: gorm.Model{ID: 8}, ActionType: "GetMessege"},
	{Model: gorm.Model{ID: 9}, ActionType: "SendMessege"},
	{Model: gorm.Model{ID: 10}, ActionType: "DeleteMessege"},
	{Model: gorm.Model{ID: 11}, ActionType: "Login"},
	{Model: gorm.Model{ID: 12}, ActionType: "Logout"},
}

var (
	passTrue = true
	passFalse= false
	passNull  *bool = nil
)
var jwtService = service.NewJwtService()

var MockUser = []entity.User{
	{Model: gorm.Model{ID: 1}, Username: "Admin@sut.ac.th", Password: jwtService.HashPassword("adm1234"), Firstname: "Admin", Lastname: "Security", Email: "rattasat7742@gmail.com", Phone: "0624987765", Pass: passNull, GenderID: 1, BranchID: 1, RoleID: 1, StatusID: 1},

	{Model: gorm.Model{ID: 2}, Username: "Teacher1@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Teacher1", Lastname: "One", Email: "Teacher1@gmail.com", Phone: "0884567891", Pass: passNull, GenderID: 2, BranchID: 1, RoleID: 2, StatusID: 1},
	{Model: gorm.Model{ID: 3}, Username: "Teacher2@sut.ac.th", Password: jwtService.HashPassword("tch456"), Firstname: "Teacher2", Lastname: "Two", Email: "Teacher2@gmail.com", Phone: "0696543214", Pass: passNull, GenderID: 1, BranchID: 1, RoleID: 2, StatusID: 1},
	{Model: gorm.Model{ID: 4}, Username: "Teacher3@sut.ac.th", Password: jwtService.HashPassword("tch789"), Firstname: "Teacher3", Lastname: "Three", Email: "Teacher3@gmail.com", Phone: "0359874658", Pass: passNull, GenderID: 1, BranchID: 1, RoleID: 2, StatusID: 1},
	{Model: gorm.Model{ID: 5}, Username: "Teacher4@sut.ac.th", Password: jwtService.HashPassword("tch012"), Firstname: "Teacher4", Lastname: "Four", Email: "Teacher4@gmail.com", Phone: "0977890123", Pass: passNull, GenderID: 2, BranchID: 1, RoleID: 2, StatusID: 1},
	{Model: gorm.Model{ID: 6}, Username: "Teacher5@sut.ac.th", Password: jwtService.HashPassword("tch345"), Firstname: "Teacher5", Lastname: "Five", Email: "Teacher5@gmail.com", Phone: "0988901234", Pass: passNull, GenderID: 1, BranchID: 2, RoleID: 2, StatusID: 1},

	{Model: gorm.Model{ID: 7}, Username: "B6500001@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student1", Lastname: "Chanakul", Email: "Student1@gmail.com", Phone: "0911234567", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Model: gorm.Model{ID: 8}, Username: "B6500002@sut.ac.th", Password: jwtService.HashPassword("std456"), Firstname: "Student2", Lastname: "Wattanapong", Email: "Student2@gmail.com", Phone: "0922345678", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Model: gorm.Model{ID: 9}, Username: "B6500003@sut.ac.th", Password: jwtService.HashPassword("std789"), Firstname: "Student3", Lastname: "Sirilak", Email: "Student3@gmail.com", Phone: "0933456789", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Model: gorm.Model{ID: 10}, Username: "B6500004@sut.ac.th", Password: jwtService.HashPassword("std012"), Firstname: "Student4", Lastname: "Thammasak", Email: "Student4@gmail.com", Phone: "0944567890", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Model: gorm.Model{ID: 11}, Username: "B6500005@sut.ac.th", Password: jwtService.HashPassword("std345"), Firstname: "Student5", Lastname: "Chansuda", Email: "Student5@gmail.com", Phone: "0955678901", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Model: gorm.Model{ID: 12}, Username: "B6500006@sut.ac.th", Password: jwtService.HashPassword("std678"), Firstname: "Student6", Lastname: "Kittipong", Email: "Student6@gmail.com", Phone: "0966789012", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Model: gorm.Model{ID: 13}, Username: "B6500007@sut.ac.th", Password: jwtService.HashPassword("std901"), Firstname: "Student7", Lastname: "Maneerat", Email: "Student7@gmail.com", Phone: "0977890123", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Model: gorm.Model{ID: 14}, Username: "B6500008@sut.ac.th", Password: jwtService.HashPassword("std234"), Firstname: "Student8", Lastname: "Phonchai", Email: "Student8@gmail.com", Phone: "0988901234", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Model: gorm.Model{ID: 15}, Username: "B6500009@sut.ac.th", Password: jwtService.HashPassword("std567"), Firstname: "Student9", Lastname: "Nanthika", Email: "Student9@gmail.com", Phone: "0999012345", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Model: gorm.Model{ID: 16}, Username: "B6500010@sut.ac.th", Password: jwtService.HashPassword("std890"), Firstname: "Student10", Lastname: "Worawit", Email: "Student10@gmail.com", Phone: "0800123456", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Model: gorm.Model{ID: 17}, Username: "B6500011@sut.ac.th", Password: jwtService.HashPassword("std111"), Firstname: "Student11", Lastname: "Pannapa", Email: "Student11@gmail.com", Phone: "0811234567", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 2},
	{Model: gorm.Model{ID: 18}, Username: "B6500012@sut.ac.th", Password: jwtService.HashPassword("std222"), Firstname: "Student12", Lastname: "Thammarat", Email: "Student12@gmail.com", Phone: "0822345678", Pass: &passTrue, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 2},
	{Model: gorm.Model{ID: 19}, Username: "B6500013@sut.ac.th", Password: jwtService.HashPassword("std333"), Firstname: "Student13", Lastname: "Kamonwan", Email: "Student13@gmail.com", Phone: "0833456789", Pass: &passTrue, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 2},
	{Model: gorm.Model{ID: 20}, Username: "B6500014@sut.ac.th", Password: jwtService.HashPassword("std444"), Firstname: "Student14", Lastname: "Suphachai", Email: "Student14@gmail.com", Phone: "0844567890", Pass: &passTrue, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 2},
}

var MockGroupProject = []entity.GroupProject{
	{Model: gorm.Model{ID: 1}, GroupNumber: 1, GroupStatus: "In Process", Membership: 5, TeacherID: 2},
	{Model: gorm.Model{ID: 2}, GroupNumber: 2, GroupStatus: "Pending", Membership: 5, TeacherID: 3},
	{Model: gorm.Model{ID: 3}, GroupNumber: 3, GroupStatus: "Completed", Membership: 5, TeacherID: 4},
	{Model: gorm.Model{ID: 4}, GroupNumber: 4, GroupStatus: "In Process", Membership: 5, TeacherID: 5},
	{Model: gorm.Model{ID: 5}, GroupNumber: 5, GroupStatus: "Pending", Membership: 5, TeacherID: 6},
}

var MockGroupMember = []entity.GroupMember{
	{Model: gorm.Model{ID: 1}, Leader: true, StudentID: 7, GroupProjectID: 1},
	{Model: gorm.Model{ID: 2}, Leader: true, StudentID: 8, GroupProjectID: 4},
	{Model: gorm.Model{ID: 3}, Leader: false, StudentID: 9, GroupProjectID: 1},
	{Model: gorm.Model{ID: 4}, Leader: true, StudentID: 11, GroupProjectID: 2},
	{Model: gorm.Model{ID: 5}, Leader: true, StudentID: 10, GroupProjectID: 3},

	{Model: gorm.Model{ID: 6}, Leader: false, StudentID: 11, GroupProjectID: 2},
	{Model: gorm.Model{ID: 7}, Leader: false, StudentID: 12, GroupProjectID: 2},
	{Model: gorm.Model{ID: 8}, Leader: false, StudentID: 13, GroupProjectID: 3},
	{Model: gorm.Model{ID: 9}, Leader: false, StudentID: 14, GroupProjectID: 4},
	{Model: gorm.Model{ID: 10}, Leader: true, StudentID: 15, GroupProjectID: 5},
	{Model: gorm.Model{ID: 11}, Leader: false, StudentID: 16, GroupProjectID: 5},

}

var MockTopics = []entity.Topic{
	{
		Model:gorm.Model{ID: 1},Title:"Smart Farm System",Description: "Automated IOT system for vegetable farming",Status:  "Approved",Proposer_role:  "Student",GroupProjectID: 1,
	},
	{
		Model:gorm.Model{ID: 2},Title:"AI Face Recognition Attendance",Description: "Check-in system using camera and AI",Status:  "Approved",Proposer_role:  "Teacher",GroupProjectID: 2,
	},
	{
		Model:gorm.Model{ID: 3},Title:"E-Commerce Mobile Application",Description: "Online shopping app with payment gateway",Status:  "Approved",Proposer_role:  "Student",GroupProjectID: 3,
	},
}

var MockTopicSelections = []entity.TopicSelection{
	{
		Model:gorm.Model{ID: 1},DateSelected:time.Now().AddDate(0, -4, 0),TopicID: 1,GroupProjectID: 1,
	},
	{
		Model:gorm.Model{ID: 2},DateSelected:time.Now().AddDate(0, -4, 0),TopicID: 2,GroupProjectID: 2,
	},
	{
		Model:gorm.Model{ID: 3},DateSelected:time.Now().AddDate(0, -4, 0),TopicID: 3,GroupProjectID: 3,
	},
}

var MockProjects = []entity.Project{
	{
		Model:gorm.Model{ID: 1},Title:"Complete Report: Smart Farm System",Abstract: "This project aims to develop an IOT solution...",Keywords: "IOT, Smart Farm, Arduino",Year: 2025,Status:"Completed",FilePath: "/uploads/projects/group1_final.pdf",SelectionID: 1,
	},
	{
		Model:gorm.Model{ID: 2},Title:"Complete Report: AI Face Recognition",Abstract: "A system to automate attendance tracking...",Keywords: "AI, Computer Vision, Python",Year: 2025,Status:"Completed",FilePath: "/uploads/projects/group2_final.pdf",SelectionID: 2,
	},
}

var MockRoom = []entity.Room{
	{Model: gorm.Model{ID: 1}, Name: "B1212", Location: "เรียนรวม1", Capacity: 50},
	{Model: gorm.Model{ID: 2}, Name: "B1213", Location: "เรียนรวม1", Capacity: 50},
	{Model: gorm.Model{ID: 3}, Name: "B5201", Location: "เรียนรวม2", Capacity: 120},
	{Model: gorm.Model{ID: 4}, Name: "B5202", Location: "เรียนรวม2", Capacity: 120},
	{Model: gorm.Model{ID: 5}, Name: "B6501", Location: "Digitech", Capacity: 400},
	{Model: gorm.Model{ID: 6}, Name: "B6503", Location: "Digitech", Capacity: 200},
}

var MockAppointmentType = []entity.AppointmentType{
	{Model: gorm.Model{ID: 1}, Name: "Topic Defense"},
	{Model: gorm.Model{ID: 2}, Name: "Progress Report"},
	{Model: gorm.Model{ID: 3}, Name: "Final Defense"},
}

var MockAppointment = []entity.Appointment{
	{
		Model:gorm.Model{ID: 1},StartDateTime:time.Date(2025, 12, 20, 9, 0, 0, 0, time.Local),
		DurationMin:30,AppointmentStatus: "completed",AppointmentTypeID: 3,RoomID:1,TeacherID: 2,GroupProjectID:3,
	},
	{
		Model:gorm.Model{ID: 2},StartDateTime:time.Date(2025, 12, 25, 13, 30, 0, 0, time.Local),
		DurationMin:30,AppointmentStatus: "scheduled",AppointmentTypeID: 2,RoomID:3,TeacherID: 3,GroupProjectID:1,
	},
}
