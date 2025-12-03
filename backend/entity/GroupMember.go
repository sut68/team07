package entity

import "gorm.io/gorm"

type GroupMember struct {
	gorm.Model
	Leader bool `json:"leader"`

	StudentID uint   `json:"student_id" valid:"required~StudentID is required"`
	Student   *User `gorm:"foreignKey:StudentID" json:"student"`
	
	GroupProjectID uint  `json:"group_project_id" valid:"required~GroupProjectID is required"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`
	Chats      []Chat        `gorm:"foreignKey:GroupMemberID" json:"chats"`
}