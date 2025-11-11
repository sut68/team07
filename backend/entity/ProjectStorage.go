package entity

import (
	"gorm.io/gorm"
)

type ProjectStorage struct {
    gorm.Model
    Title         string `json:"title"`
    Description   string `json:"description"`
	Keywords 	string `json:"keywords"`
	Year		int    `json:"year"`
	FilePath	string `json:"file_path"`

	TeacherID uint    `json:"teacher_id"`
	Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`
}

