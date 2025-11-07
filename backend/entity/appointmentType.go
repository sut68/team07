package entity

import "gorm.io/gorm"

type AppointmentType struct {
	gorm.Model
	Name string `json:"name"`

	Appointments []Appointment `gorm:"foreignKey:AppointmentTypeID" json:"appointments"`
}
