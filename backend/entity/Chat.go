package entity

import (
	"time"
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

	ReceiverID uint   `json:"receiver_id"`
	Receiver   *User  `gorm:"foreignKey:ReceiverID" json:"receiver"`

	Message   string    `json:"message"`
	SentWhen  time.Time `json:"sent_when"`
}
