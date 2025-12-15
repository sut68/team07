package entity

import (
	"time"

	"gorm.io/gorm"
)

type IssueReport struct {
	gorm.Model
	Detail     string    `json:"detail" valid:"required~Detail is required"`
	ReportDate time.Time `json:"report_date" valid:"required~ReportDate is required"`

	StatusID uint         `json:"status_id" valid:"required~StatusID is required"`
	Status   *IssueStatus `gorm:"foreignKey:StatusID" json:"status"`

	TypeID uint       `json:"type_id" valid:"required~TypeID is required"`
	Type   *IssueType `gorm:"foreignKey:TypeID" json:"type"`

	UserID uint  `json:"user_id " valid:"required~UserID is required"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`
}

//true
