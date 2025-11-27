package entity

import (
	"gorm.io/gorm"
)

type IssueType struct {
	gorm.Model
	Type string `json:"type" valid:"required~Type is required"`

	IssueReports []IssueReport `gorm:"foreignKey:TypeID" json:"issue_reports"`
}
//true