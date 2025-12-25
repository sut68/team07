package entity

import "gorm.io/gorm"

type News struct {
	gorm.Model
	Title       string `gorm:"type:varchar(255);not null" valid:"required~Title is required"`
	Description string `gorm:"type:text;not null" valid:"required~Description is required"`
	File        string `gorm:"type:varchar(512)"`
	Category    string `gorm:"type:varchar(50);not null" valid:"required~Category is required"`

	TeacherID uint  `json:"teacher_id"`
	Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`
}
