package entity

import (
	"gorm.io/gorm"
)

type Notification struct {
	gorm.Model
	Title   string `json:"title"`   
	Message string `json:"message"` 
	IsRead  bool   `json:"is_read" gorm:"default:false"` 
	
	UserID  uint   `json:"user_id"` 
	User    *User  `gorm:"foreignKey:UserID" json:"user"`
}