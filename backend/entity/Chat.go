package entity

import (
	"time"
	"gorm.io/gorm"
)

type Chat struct {
	gorm.Model

	GroupProjectID uint          `json:"group_project_id"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`

	ProcessID uint              `json:"process_id"`
	Process   *Progress  `gorm:"foreignKey:ProcessID" json:"process"`

	SenderID   uint   `json:"sender_id"`
	Sender     *User  `gorm:"foreignKey:SenderID" json:"sender"`

	ReceiverID uint   `json:"receiver_id"`
	Receiver   *User  `gorm:"foreignKey:ReceiverID" json:"receiver"`

	Message   string    `json:"message"`
	SentWhen  time.Time `json:"sent_when"`
}
