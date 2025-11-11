package entity

import (
	"gorm.io/gorm"
)

type ProjectTopic struct {
    gorm.Model
    Title       string `json:"title"`
    Objective   string `json:"objective"`
    Scope       string `json:"scope"`
    Description string `json:"description"`

    TeacherID uint    `json:"teacher_id"`
    TeacherInfo   *User `gorm:"foreignKey:TeacherID" json:"teacher"`
}

