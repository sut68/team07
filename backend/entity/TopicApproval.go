package entity

import (
	"gorm.io/gorm"
	"time"
)

type TopicApproval struct {
    gorm.Model
    Status       string    `json:"status" valid:"required~Status is required"`  
    Comment      string    `json:"comment" valid:"required~Comment is required"`
    ApprovalDate time.Time `json:"approval_date" valid:"required~ApprovalDate is required"`

    TeacherID uint    `json:"teacher_id" valid:"required~TeacherID is required"`
    Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`

    SelectionID uint          `json:"selection_id" valid:"required~SelectionID is required"`
    TopicSelection *TopicSelection `gorm:"foreignKey:SelectionID" json:"topic_selection"`
}

//true
