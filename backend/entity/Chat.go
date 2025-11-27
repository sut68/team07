package entity

import (
	"gorm.io/gorm"
)

type Chat struct {
	gorm.Model

	GroupMemberID uint         `json:"group_member_id" valid:"required~GroupMemberID is required"`
	GroupMember   *GroupMember `gorm:"foreignKey:GroupMemberID" json:"group_member"`

	ProcessID uint              `json:"process_id" valid:"required~ProcessID is required"`
	Process   *Progress  `gorm:"foreignKey:ProcessID" json:"process"`

	SenderID   uint   `json:"sender_id" valid:"required~SenderID is required"`
	Sender     *User  `gorm:"foreignKey:SenderID" json:"sender"`


	Message   string    `json:"message" valid:"required~Message is required"`
}
