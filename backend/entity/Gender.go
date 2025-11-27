package entity

import "gorm.io/gorm"

type Gender struct{
	gorm.Model
	Name string `json:"name" valid:"required~Name is required"`

	Users []User `gorm:"foreignKey:GenderID"`
}

//true
