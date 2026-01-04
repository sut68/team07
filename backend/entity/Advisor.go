package entity

import "gorm.io/gorm"

type SelectAdvisor struct {
	gorm.Model
	No uint `json:"no" valid:"required,range(1|20)~Number must be between 1 and 20"`
	// Title string `json:"title" valid:"required~Title is required"`
	Description string `json:"description" valid:"required~Description is required"`
	Status      string `json:"status" valid:"required~Status is required" gorm:"default:'pending'"`

	GroupProjectID uint          `json:"group_project_id" valid:"required~GroupProjectID is required"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`
	TeacherID      uint          `json:"teacher_id" valid:"required~TeacherID is required"`
	Teacher        *User         `gorm:"foreignKey:TeacherID" json:"teacher"`
}
