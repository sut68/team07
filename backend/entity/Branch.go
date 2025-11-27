package entity

import (
	"gorm.io/gorm"
)

type Branch struct {
	gorm.Model
	BranchName string `gorm:"column:branch_name" valid:"required~BranchName is required" json:"branch_name"`
	
	Users []User `gorm:"foreignKey:BranchID"`
}
