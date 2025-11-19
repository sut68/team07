package entity

import (
	"gorm.io/gorm"
)

type Progress struct {
	gorm.Model

	GroupProjectID uint          `json:"group_project_id"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`

	File     string  	`json:"file"`
	Comment  string     `json:"comment"`
}

//true