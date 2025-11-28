package entity

import (
	"gorm.io/gorm"
)

type Progress struct {
	gorm.Model

	GroupProjectID uint          `json:"group_project_id" valid:"required~GroupProjectID is required"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`

	File     string  	`json:"file" valid:"required~File is required"`
	Comment  string     `json:"comment" valid:"required~Comment is required"`
}
