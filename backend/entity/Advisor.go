package entity

import "gorm.io/gorm"

type SelectAdvisor struct {
	gorm.Model
	No int `json:"no"`
	Title string `json:"title"`
	Description string `json:"description"`
	GroupProjectID uint `json:"group_project_id"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`
	TeacherID uint   `json:"teacher_id"`
	Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`
}

//true