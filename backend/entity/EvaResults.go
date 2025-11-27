package entity

import (
	"time"
	"gorm.io/gorm"
)

type EvaResult struct {
	gorm.Model
	Score   float64   `json:"score" valid:"required,range(0|100)~Score must be between 0 and 100"`
	Comment string    `json:"comment"`
	Date    time.Time `json:"date" valid:"required~Date is required"`

	CriteriaID uint      `json:"criteria_id" valid:"required~CriteriaID is required"`
	Criteria   *Criteria  `gorm:"foreignKey:CriteriaID" json:"criteria"`

	AppointmentID uint        `json:"appointment_id" valid:"required~AppointmentID is required"`
	Appointment   *Appointment  `gorm:"foreignKey:AppointmentID" json:"appointment"`

	TeacherID uint   `json:"teacher_id" valid:"required~TeacherID is required"`
	Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`
}
//true