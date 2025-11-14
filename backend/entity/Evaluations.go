package entity

import "gorm.io/gorm"

type Evaluation struct {
	gorm.Model
	Name         string  `json:"name"`
	TotalScore   float64 `json:"total_score"`
	ForGroupOnly bool    `json:"for_group_only"`

	AppointmentID uint        `json:"appointment_id"`
	Appointment   *Appointment `gorm:"foreignKey:AppointmentID" json:"appointment"`
	Criteria []Criteria `gorm:"foreignKey:EvaluationID" json:"criteria"`
}

//true
