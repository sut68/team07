package entity

import (
	"gorm.io/gorm"
)

type IssueType struct {
	gorm.Model
	Type string `json:"type"`

	IssueReports []IssueReport `gorm:"foreignKey:TypeID" json:"issue_reports"`
}
