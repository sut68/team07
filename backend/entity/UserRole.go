package entity

import "gorm.io/gorm"

type UserRole struct{
	gorm.Model
	Role string `json:"role" valid:"required~Role is required"`

	Users []User `gorm:"foreignKey:RoleID"`
}
