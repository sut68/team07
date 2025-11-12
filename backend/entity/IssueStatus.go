package entity

import (
	"gorm.io/gorm"
)

type IssueStatus struct {
	gorm.Model
	Status string `json:"status"`
}
