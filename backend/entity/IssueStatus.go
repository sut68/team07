package entity

import (
	"gorm.io/gorm"
)

type IssueStatus struct {
	gorm.Model
	Status string `json:"status"`

	IssueReports []IssueReport `gorm:"foreignKey:StatusID" json:"issue_reports"`
}
//true