package entity

import "gorm.io/gorm"

type User struct {
    gorm.Model
    Username string `json:"username"`
    Password string `gorm:"not null" json:"-"`
	Firstname string `json:"firstname"`
	Lastname  string `json:"lastname"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
    Pass    bool   `json:"pass"`

	GenderID uint   `json:"gender_id"`
	Gender   *Gender `gorm:"foreignKey:GenderID" json:"gender"`

	BranchID uint    `json:"branch_id"`
	Branch   *Branch `gorm:"foreignKey:BranchID" json:"branch"`

    RoleID uint          `json:"role_id"`
    Role   *UserRole `gorm:"foreignKey:RoleID" json:"role"`

    StatusID uint          `json:"status_id"`
    Status   *AccountStatus `gorm:"foreignKey:StatusID" json:"status"`

	GroupProjects []GroupProject `gorm:"foreignKey:TeacherID" json:"group_projects"`
	GroupMembers  []GroupMember  `gorm:"foreignKey:StudentID" json:"group_members"`
	Advisors      []Advisor      `gorm:"foreignKey:TeacherID" json:"advisors"`
}