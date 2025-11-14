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
    Pass    *bool   `json:"pass"`

	GenderID uint   `json:"gender_id"`

	BranchID uint    `json:"branch_id"`
	Branch   *Branch `gorm:"foreignKey:BranchID" json:"branch"`
    RoleID uint          `json:"role_id"`

    StatusID uint          `json:"status_id"`


	ChatsReceived []Chat         `gorm:"foreignKey:ReceiverID" json:"chats_received"`

	
}