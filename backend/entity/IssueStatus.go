package entity

import (
	"gorm.io/gorm"
)

type IssueStatus struct {
	gorm.Model
	Status string `json:"status" valid:"required~Status is required"`

	IssueReports []IssueReport `gorm:"foreignKey:StatusID" json:"issue_reports"`
}
//true