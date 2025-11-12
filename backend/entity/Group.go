package entity

import (
	"gorm.io/gorm"
)

type Group struct {
	gorm.Model
	ProjectName string `json:"project_name"`

	TeacherID int   `json:"teacher_id"`
	Teacher   *TeacherInfo `gorm:"foreignKey:TeacherID" json:"teacher"`
}
