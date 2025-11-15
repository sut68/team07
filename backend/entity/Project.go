package entity

import (
	"gorm.io/gorm"
	"time"
)

type Project struct {
	gorm.Model
	Title         string    `gorm:"column:Title"`
	Abstract      string    `gorm:"column:Abstract"`
	Keywords      string    `gorm:"column:Keywords"`
	Year          int       `gorm:"column:Year"`
	Status        string    `gorm:"column:Status"`
	FilePath      string    `gorm:"column:FilePath"`
	CreatedDate   time.Time `gorm:"column:CreatedDate"`
	UpdatedDate   time.Time `gorm:"column:UpdatedDate"`
	

	SelectionID uint          `json:"selection_id"`
	TopicSelection *TopicSelection `gorm:"foreignKey:SelectionID" json:"topic_selection"`
	


}

//true
