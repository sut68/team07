package entity

import (
	"gorm.io/gorm"
)

type IssueType struct {
	gorm.Model
	Type string `json:"type"`
}
