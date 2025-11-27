package entity

import "gorm.io/gorm"

type Room struct {
	gorm.Model
	Name     string `json:"name" valid:"required~Name is required"`
	Location string `json:"location" valid:"required~Location is required"`
	Capacity uint    `json:"capacity" valid:"required,range(1|1500)~Capacity must be between 1 and 1500"`

	Appointments []Appointment `gorm:"foreignKey:RoomID" json:"appointments"`
}

//true