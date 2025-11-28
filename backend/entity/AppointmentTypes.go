package entity

import "gorm.io/gorm"

type AppointmentType struct {
	gorm.Model
	Name string `json:"name" valid:"required~Name is required"`

	Appointments []Appointment `gorm:"foreignKey:AppointmentTypeID" json:"appointments"`
	Evaluation []Evaluation  `gorm:"foreignKey:AppointmentTypeID" json:"evaluations"`
}