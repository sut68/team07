package entity

import (
	"gorm.io/gorm"
)

type Branch struct {
	gorm.Model
	BranchName string `gorm:"column:branch_name"`
	
	Users []User `gorm:"foreignKey:BranchID"`
}