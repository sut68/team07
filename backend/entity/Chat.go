package entity

import (
	"gorm.io/gorm"
)

type Chat struct {
	gorm.Model

	GroupProjectID uint          `json:"group_project_id" valid:"required~GroupProjectID is required"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`

	ProcessID uint              `json:"process_id" valid:"required~ProcessID is required"`
	Process   *Progress  `gorm:"foreignKey:ProcessID" json:"process"`

	SenderID   uint   `json:"sender_id" valid:"required~SenderID is required"`
	Sender     *User  `gorm:"foreignKey:SenderID" json:"sender"`


	Message   string    `json:"message" valid:"required~Message is required"`
}
