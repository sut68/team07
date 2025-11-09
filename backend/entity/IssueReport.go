package entity

import (
	"gorm.io/gorm"
	"time"
)

type IssueReport struct {
	gorm.Model
	Detail     string    `json:"detail"`
	ReportDate time.Time `json:"report_date"`

	StatusID uint          `json:"status_id"`
	Status   *IssueStatus `gorm:"foreignKey:StatusID" json:"status"`

	TypeID uint        `json:"type_id"`
	Type   *IssueType `gorm:"foreignKey:TypeID" json:"type"`

	UserID uint   `json:"user_id"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`
}
