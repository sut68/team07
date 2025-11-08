package entity

import (
	"gorm.io/gorm"
)

type Group struct {
	gorm.Model
	ProjectName string `gorm:"project_name"`

	TeacherID int   `json:"teacher_id"`
	Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`

	
}