package entity

import (
	"gorm.io/gorm"
	"time"
)

type TopicApproval struct {
    gorm.Model
    Status string `json:"status" valid:"required,in(Approved|Rejected)~Invalid status"`  
    Comment      string    `json:"comment"`
    ApprovalDate time.Time `json:"approval_date"`

    TeacherID uint    `json:"teacher_id" valid:"required~TeacherID is required"`
    Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`

    TopicID uint          `json:"topic_id" valid:"required~TopicID is required"`
    Topic   *Topic `gorm:"foreignKey:TopicID" json:"topic"`

}

