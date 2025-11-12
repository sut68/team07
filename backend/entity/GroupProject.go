package entity

import (
	"gorm.io/gorm"
)

type GroupProject struct {
	gorm.Model
	GroupNumber int   `json:"group_number"`
	GroupStatus string `json:"group_status"`
	TeacherID   uint  `json:"teacher_id"`
	Teacher     *User `gorm:"foreignKey:TeacherID" json:"teacher"`

	GroupMembers []GroupMember `gorm:"foreignKey:GroupProjectID" json:"group_members"`
	SelectAdvisors []SelectAdvisor `gorm:"foreignKey:GroupProjectID" json:"select_advisors"`
	Progress   []Progress    `gorm:"foreignKey:GroupProjectID" json:"progress"`
	TopicSelections []TopicSelection `gorm:"foreignKey:GroupProjectID" json:"topic_selections"`
	Topic 	 []Topic        `gorm:"foreignKey:GroupProjectID" json:"topics"`
}

//true
