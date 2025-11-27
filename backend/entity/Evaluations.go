package entity

import "gorm.io/gorm"

type Evaluation struct {
	gorm.Model
	Name         string  `json:"name" valid:"required~Name is required"`
	TotalScore   float64 `json:"total_score" valid:"required,range(0|100)~TotalScore must be between 0 and 100"`
	ForGroupOnly bool    `json:"for_group_only"`

	AppointmentTypeID uint             `json:"appointment_type_id" valid:"required~AppointmentTypeID is required"`
	AppointmentType   *AppointmentType `gorm:"foreignKey:AppointmentTypeID" json:"appointment_type"`
	Criteria []Criteria `gorm:"foreignKey:EvaluationID" json:"criteria"`
}

//true
