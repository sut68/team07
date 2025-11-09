package entity

import (
	"time"
	"gorm.io/gorm"
)

type EvaResult struct {
	gorm.Model
	Score   float64   `json:"score"`
	Comment string    `json:"comment"`
	Date    time.Time `json:"date"`

	CriteriaID uint      `json:"criteria_id"`
	Criteria   *Criteria  `gorm:"foreignKey:CriteriaID" json:"criteria"`

	AppointmentID uint        `json:"appointment_id"`
	Appointment   *Appointment  `gorm:"foreignKey:AppointmentID" json:"appointment"`

	TeacherID uint   `json:"teacher_id"`
	Teacher   *TeacherInfo `gorm:"foreignKey:TeacherID" json:"teacher"`
}
