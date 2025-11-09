package entity

import (
	"time"
	"gorm.io/gorm"
)

type Progress struct {
	gorm.Model

	GroupID  uint    	`json:"group_id"`
	Group    *Group  	`gorm:"foreignKey:GroupID" json:"group"`

	File     string  	`json:"file"`
	Send 	 time.Time 	`json:"send"`
}