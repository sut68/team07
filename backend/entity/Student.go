package entity

import "gorm.io/gorm"

type Student struct {
	gorm.Model
	Username string `gorm:"unique"`
	Password string `gorm:"not null"`

	Email string `gorm:"unique"`
	Phone string
	Der   string
}
