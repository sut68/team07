package entity

import (
	"gorm.io/gorm"
)

type Project struct {
	gorm.Model
	Title         string    `json:"title" valid:"required~Title is required"`
	Abstract      string    `json:"abstract" valid:"required~Abstract is required"`
	Keywords      string    `json:"keywords" valid:"required~Keywords is required"`
	Year          int       `json:"year" valid:"required,range(2560|9999)~Year must be between 2560 and 99999"`
	Status        string    `json:"status" valid:"required~Status is required"`
	// FilePath      string    `json:"file_path" valid:"required~FilePath is required"`
	FilePath      string    `json:"file_path"` // Optional


	SelectionID uint          `json:"selection_id" valid:"required~SelectionID is required"`
	TopicSelection *TopicSelection `gorm:"foreignKey:SelectionID" json:"topic_selection"`
	
}

