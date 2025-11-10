package entity

import (
	"gorm.io/gorm"
)

type Branch struct {
	gorm.Model
	BranchName string `gorm:"column:branch_name"`
	
	Projects []Project `gorm:"foreignKey:BranchID"`
	TeacherInfo []TeacherInfo `gorm:"foreignKey:BranchID"`
	StudentInfo []StudentInfo `gorm:"foreignKey:BranchID"`
}