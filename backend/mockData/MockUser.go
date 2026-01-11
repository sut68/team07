package mockdata

import (
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/service"
)

var (
	passTrue        = true
	passFalse       = false
	passNull  *bool = nil
)

var jwtService = service.NewJwtService()

var MockUser = []entity.User{

	{Username: "Admin@sut.ac.th", Password: jwtService.HashPassword("adm123"), Firstname: "Admin", Lastname: "Security", Email: "Admin@gmail.com", Phone: "09622934415", Pass: passNull, GenderID: 1, BranchID: 1, RoleID: 1, StatusID: 1},

	{Username: "Teacher1@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Komsan", Lastname: "Srivisut", Email: "Teacher1@gmail.com", Phone: "0884567891", Pass: passNull, GenderID: 1, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher2@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Parin", Lastname: "Sornletrlamvanich", Email: "Teacher2@gmail.com", Phone: "0696543214", Pass: passNull, GenderID: 1, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher3@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Kacha", Lastname: "Chansilp", Email: "Teacher3@gmail.com", Phone: "0359874658", Pass: passNull, GenderID: 1, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher4@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Kittisak", Lastname: "Kerdprasop", Email: "Teacher4@gmail.com", Phone: "0977890123", Pass: passNull, GenderID: 1, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher5@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Nittaya", Lastname: "Kerdprasop", Email: "Teacher5@gmail.com", Phone: "0988901234", Pass: passNull, GenderID: 2, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher6@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Nuntawut", Lastname: "Kaoungku", Email: "Teacher6@gmail.com", Phone: "0811111111", Pass: passNull, GenderID: 1, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher7@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Paramate", Lastname: "Horkaew", Email: "Teacher7@gmail.com", Phone: "0822222222", Pass: passNull, GenderID: 1, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher8@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Supaporn", Lastname: "Bunrit", Email: "Teacher8@gmail.com", Phone: "0833333333", Pass: passNull, GenderID: 2, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher9@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Sarunya", Lastname: "Kanjanawattana", Email: "Teacher9@gmail.com", Phone: "0844444444", Pass: passNull, GenderID: 2, BranchID: 1, RoleID: 2, StatusID: 1},
	{Username: "Teacher10@sut.ac.th", Password: jwtService.HashPassword("tch123"), Firstname: "Wichai", Lastname: "Srisuruk", Email: "Teacher10@gmail.com", Phone: "0855555555", Pass: passNull, GenderID: 1, BranchID: 1, RoleID: 2, StatusID: 1},

	{Username: "B6500001@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Rattasat", Lastname: "Thongsangiam", Email: "Student1@gmail.com", Phone: "0911234567", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500002@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Thanathon", Lastname: "Hodon", Email: "Student2@gmail.com", Phone: "0922345678", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500003@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student3", Lastname: "Sirilak", Email: "Student3@gmail.com", Phone: "0933456789", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500004@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student4", Lastname: "Thammasak", Email: "Student4@gmail.com", Phone: "0944567890", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500005@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student5", Lastname: "Chansuda", Email: "Student5@gmail.com", Phone: "0955678901", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500006@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student6", Lastname: "Kittipong", Email: "Student6@gmail.com", Phone: "0966789012", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500007@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student7", Lastname: "Maneerat", Email: "Student7@gmail.com", Phone: "0977890123", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500008@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student8", Lastname: "Phonchai", Email: "Student8@gmail.com", Phone: "0988901234", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500009@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student9", Lastname: "Nanthika", Email: "Student9@gmail.com", Phone: "0999012345", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500010@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student10", Lastname: "Worawit", Email: "Student10@gmail.com", Phone: "0800123456", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500011@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student11", Lastname: "Pannapa", Email: "Student11@gmail.com", Phone: "0811234567", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 2},
	{Username: "B6500012@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student12", Lastname: "Thammarat", Email: "Student12@gmail.com", Phone: "0822345678", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 2},
	{Username: "B6500013@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student13", Lastname: "Kamonwan", Email: "Student13@gmail.com", Phone: "0833456789", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 2},
	{Username: "B6500014@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student14", Lastname: "Suphachai", Email: "Student14@gmail.com", Phone: "0844567890", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 2},
	{Username: "B6500015@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student15", Lastname: "Somsak", Email: "Student15@gmail.com", Phone: "0855678901", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500016@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student16", Lastname: "Anucha", Email: "Student16@gmail.com", Phone: "0866789012", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500017@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student17", Lastname: "Pimchanok", Email: "Student17@gmail.com", Phone: "0877890123", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500018@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student18", Lastname: "Kriangsak", Email: "Student18@gmail.com", Phone: "0888901234", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500019@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student19", Lastname: "Sudarat", Email: "Student19@gmail.com", Phone: "0899012345", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500020@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student20", Lastname: "Ratchanon", Email: "Student20@gmail.com", Phone: "0801111111", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500021@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student21", Lastname: "Natcha", Email: "Student21@gmail.com", Phone: "0812222222", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500022@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student22", Lastname: "Theerawat", Email: "Student22@gmail.com", Phone: "0823333333", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500023@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student23", Lastname: "Kanokwan", Email: "Student23@gmail.com", Phone: "0834444444", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500024@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student24", Lastname: "Chaiwat", Email: "Student24@gmail.com", Phone: "0845555555", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 1},
	{Username: "B6500025@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student25", Lastname: "Siriporn", Email: "Student25@gmail.com", Phone: "0856666666", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 2},
	{Username: "B6500026@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student26", Lastname: "Nattapong", Email: "Student26@gmail.com", Phone: "0867777777", Pass: &passFalse, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 2},
	{Username: "B6500027@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student27", Lastname: "Arisa", Email: "Student27@gmail.com", Phone: "0878888888", Pass: &passFalse, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 2},
	{Username: "B6500028@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student28", Lastname: "Pongsatorn", Email: "Student28@gmail.com", Phone: "0889999999", Pass: &passTrue, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 2},
	{Username: "B6500029@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student29", Lastname: "Benjamas", Email: "Student29@gmail.com", Phone: "0890000000", Pass: &passTrue, GenderID: 2, BranchID: 1, RoleID: 3, StatusID: 2},
	{Username: "B6500030@sut.ac.th", Password: jwtService.HashPassword("std123"), Firstname: "Student30", Lastname: "LastName30", Email: "Student30@gmail.com", Phone: "0891111111", Pass: &passTrue, GenderID: 1, BranchID: 1, RoleID: 3, StatusID: 2},
}
