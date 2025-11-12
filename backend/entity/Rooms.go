package entity

import "gorm.io/gorm"

type Room struct {
	gorm.Model
	Name     string `json:"name"`
	Location string `json:"location"`
	Capacity int    `json:"capacity"`

	Appointments []Appointment `gorm:"foreignKey:RoomID" json:"appointments"`
}
//true