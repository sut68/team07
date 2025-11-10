package entity

import "gorm.io/gorm"

type StudentInfo struct {
	gorm.Model
	Firstname string `json:"firstname"`
	Lastname  string `json:"lastname"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`

	GenderID uint   `json:"gender_id"`
	Gender   *Gender `gorm:"foreignKey:GenderID" json:"gender"`

	UserID uint   `json:"user_id"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`

	GroupID uint    `json:"group_id"`
	Group   *Group `gorm:"foreignKey:GroupID" json:"group"`

	BranchID uint    `json:"branch_id"`
	Branch   *Branch `gorm:"foreignKey:BranchID" json:"branch"`
}
