package entity

import "gorm.io/gorm"

type User struct {
	gorm.Model
	UserID   uint   `gorm:"primaryKey;autoIncrement"`
	Username string `gorm:"unique"`
	Password string `gorm:"not null"`
	Email    string `gorm:"unique"`
	Phone    string
	Der  string
}


