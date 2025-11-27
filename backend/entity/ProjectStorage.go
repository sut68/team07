package entity

import (
	"gorm.io/gorm"
)

type ProjectStorage struct {
    gorm.Model
    Title         string `json:"title" valid:"required~Title is required"`
    Abstract	  string `json:"abstract" valid:"required~Abstract is required"`
	Keywords 	string `json:"keywords" valid:"required~Keywords is required"`
	Year		int    `json:"year" valid:"required,range(2000|2100)~Year must be between 2000 and 2100"`
	FilePath	string `json:"file_path" valid:"required~FilePath is required"`
	TeacherID uint    `json:"teacher_id" valid:"required~TeacherID is required"`
	Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`
}

//true