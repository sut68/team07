package entity

import "gorm.io/gorm"

type GroupMember struct {
	gorm.Model
	Leader bool `json:"leader"`

	StudentID uint   `json:"student_id"`
	Student   *User `gorm:"foreignKey:StudentID" json:"student"`
	
	GroupProjectID uint  `json:"group_project_id"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`

}
