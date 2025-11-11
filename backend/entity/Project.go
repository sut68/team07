package entity

import (
	"gorm.io/gorm"
)

type Project struct {
	gorm.Model
	Title         string    `gorm:"column:Title"`
	Abstract      string    `gorm:"column:Abstract"`
	Keywords      string    `gorm:"column:Keywords"`
	Year          int       `gorm:"column:Year"`
	Status        string    `gorm:"column:Status"`
	FilePath      string    `gorm:"column:FilePath"`

	SelectionID uint          `json:"selection_id"`
	TopicSelection *TopicSelection `gorm:"foreignKey:SelectionID" json:"topic_selection"`
	


}