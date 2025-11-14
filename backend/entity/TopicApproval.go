package entity

import (
	"gorm.io/gorm"
	"time"
)

type TopicApproval struct {
    gorm.Model
    Status       string    `json:"status"`  
    Comment      string    `json:"comment"`
    ApprovalDate time.Time `json:"approval_date"`

    TeacherID uint    `json:"teacher_id"`
    Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`

    SelectionID uint          `json:"selection_id"`
    TopicSelection *TopicSelection `gorm:"foreignKey:SelectionID" json:"topic_selection"`
}

//true
