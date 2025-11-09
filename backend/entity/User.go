package entity

import "gorm.io/gorm"

type Role string

const (
	Teacher   Role = "teacher"
	Student   Role = "student"
	Leader	Role = "leader"
	Admin   Role = "admin"
)

type User struct {
	gorm.Model
	Username string `gorm:"unique"`
	Password string `gorm:"not null"`
	Role    Role 
	// `gorm:"column:role;type:enum('teacher','student','admin')"`
	AccountStatus string `gorm:"account_status;"`
}