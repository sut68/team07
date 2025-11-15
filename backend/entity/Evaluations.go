package entity

import "gorm.io/gorm"

type Evaluation struct {
	gorm.Model
	Name         string  `json:"name"`
	TotalScore   float64 `json:"total_score"`
	ForGroupOnly bool    `json:"for_group_only"`

	AppointmentTypeID uint             `json:"appointment_type_id"`
	AppointmentType   *AppointmentType `gorm:"foreignKey:AppointmentTypeID" json:"appointment_type"`
	Criteria []Criteria `gorm:"foreignKey:EvaluationID" json:"criteria"`
}

//true
