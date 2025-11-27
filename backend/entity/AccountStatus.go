package entity

import "gorm.io/gorm"

type AccountStatus struct {
	gorm.Model
	Status string `json:"status" valid:"required~Status is required"`

	Users []User `gorm:"foreignKey:StatusID"`
}
//true
