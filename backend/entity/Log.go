package entity

import (
	"time"
	"gorm.io/gorm"
)


type Logs struct {
	gorm.Model

	UserID     uint       `json:"user_id"`
	User       *User      `gorm:"foreignKey:UserID" json:"user"`
	ActionType ActionType `gorm:"column:action_type;type:enum('Adduser','Deleteuser','Modifyuser')" json:"action_type"`
	Send 	   time.Time  `json:"send"`
}