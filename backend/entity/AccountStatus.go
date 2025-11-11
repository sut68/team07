package entity

import "gorm.io/gorm"

type AccountStatus struct {
	gorm.Model
	Status string `json:"status"`

	Users []User `gorm:"foreignKey:StatusID"`
}
