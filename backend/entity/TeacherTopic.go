package entity

import (
	"gorm.io/gorm"
)

type TeacherTopic struct {
    gorm.Model
    Title         string `json:"title"`
    Description   string `json:"description"`
	Status 	  string `json:"status"`
    FileAttachment *string `json:"file_attachment,omitempty"`
    
    TopicSelectionID  []TopicSelection `gorm:"foreignKey:TeacherTopicID" json:"topic_selections"`
}

