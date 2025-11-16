package entity

import "gorm.io/gorm"

type AppointmentType struct {
	gorm.Model
	Name string `json:"name"`

	Appointments []Appointment `gorm:"foreignKey:AppointmentTypeID" json:"appointments"`
	Evaluation []Evaluation  `gorm:"foreignKey:AppointmentTypeID" json:"evaluations"`
}
//true