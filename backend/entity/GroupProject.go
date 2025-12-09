package entity

import (
	"gorm.io/gorm"
)

type GroupProject struct {
	gorm.Model
	GroupNumber uint   `json:"group_number" valid:"required,range(1|40)~GroupNumber must be between 1 and 40"`
	GroupStatus string `json:"group_status" valid:"required~GroupStatus is required"`
	Year		int		`json:"year" valid:"required,range(2560|9999)~Year must be between 2560 and 99999"`
	Membership  int    `json:"membership" valid:"required,range(3|5)~Membership must be between 3 and 5"` // จำนวนสมาชิกต่อกลุ่ม

	// Teacher ต้องว่าง หากยังไม้เลือกอาจารย์ที่ปรึกษา
	TeacherID *uint `json:"teacher_id"`
	Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`

	GroupMembers    []GroupMember    `gorm:"foreignKey:GroupProjectID" json:"group_members"`
	SelectAdvisors  []SelectAdvisor  `gorm:"foreignKey:GroupProjectID" json:"select_advisors"`
	Progress        []Progress       `gorm:"foreignKey:GroupProjectID" json:"progress"`
	Appointment     []Appointment    `gorm:"foreignKey:GroupProjectID" json:"appointments"`
	TopicSelections []TopicSelection `gorm:"foreignKey:GroupProjectID" json:"topic_selections"`
	Topic           []Topic          `gorm:"foreignKey:GroupProjectID" json:"topics"`
}
