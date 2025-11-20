package entity

import "gorm.io/gorm"

type PasswordHistory struct {
	gorm.Model
	UserID      uint
	User 	  *User `gorm:"foreignKey:UserID"`
	OldPasswordHash string `gorm:"not null"`
}