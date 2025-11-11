package entity

import (
	"gorm.io/gorm"
)

type GroupProject struct {
	gorm.Model
	GroupNumber int   `json:"group_number"`
	TeacherID   uint  `json:"teacher_id"`
	Teacher     *User `gorm:"foreignKey:TeacherID" json:"teacher"`

	GroupMembers []GroupMember `gorm:"foreignKey:GroupProjectID" json:"group_members"`
	Progress   []Progress    `gorm:"foreignKey:GroupProjectID" json:"progress"`
}
