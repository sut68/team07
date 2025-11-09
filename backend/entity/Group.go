package entity

import (
	"gorm.io/gorm"
)

type Group struct {
	gorm.Model
	ProjectName string `gorm:"project_name"`

	TeacherID uint          `json:"teacher_id"`
	Teacher   *TeacherInfo `gorm:"foreignKey:TeacherID" json:"teacher"`

	ProjectID uint        `json:"project_id"`
	Project   *Project     `gorm:"foreignKey:ProjectID" json:"project"`
}
