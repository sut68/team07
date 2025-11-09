package entity

import "gorm.io/gorm"

type TeacherInfo struct {
	gorm.Model
	Firstname string `json:"firstname"`
	Lastname  string `json:"lastname"`
	Email     string `json:"email"`
	Major     string `json:"major"`
	Phone     string `json:"phone"`

	UserID uint   `json:"user_id"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`

	GenderID uint   `json:"gender_id"`
	Gender   *Gender `gorm:"foreignKey:GenderID" json:"gender"`
}
