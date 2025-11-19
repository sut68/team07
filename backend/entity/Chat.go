package entity

import (
	"gorm.io/gorm"
)

type Chat struct {
	gorm.Model

	GroupMemberID uint         `json:"group_member_id"`
	GroupMember   *GroupMember `gorm:"foreignKey:GroupMemberID" json:"group_member"`

	ProcessID uint              `json:"process_id"`
	Process   *Progress  `gorm:"foreignKey:ProcessID" json:"process"`

	SenderID   uint   `json:"sender_id"`
	Sender     *User  `gorm:"foreignKey:SenderID" json:"sender"`

	Message   string    `json:"message"`
}
