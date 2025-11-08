package entity

import "gorm.io/gorm"

type StudentInfo struct {
	gorm.Model
	Firstname string `gorm:"firstname"`
	Lastname  string `gorm:"lastname"`
	Email     string `gorm:"email"`
	Major     string `gorm:"major"`
	Phone     string `gorm:"phone"`
	Gender    Gender `gorm:"column:gender;type:enum('male','female')"`

	UserID int   `json:"user_id"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`

	GroupID int    `json:"group_id"`
	Group   *Group `gorm:"foreignKey:GroupID" json:"group"`
}