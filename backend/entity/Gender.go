package entity

import "gorm.io/gorm"

type Gender string

const (
	Male   Gender = "Male"
	Female Gender = "Female"
)

type GenderInfo struct {
	gorm.Model
	Type Gender `json:"type"` 
	// `gorm:"column:Gender;type:enum('Male','Female')"`
}
