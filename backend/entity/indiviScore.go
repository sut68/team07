package entity

import "gorm.io/gorm"

type IndividualScore struct {
	gorm.Model
	Score float64 `json:"score"`

	CriteriaID uint      `json:"criteria_id"`
	Criteria   *Criteria  `gorm:"foreignKey:CriteriaID" json:"criteria"`

	AppointmentID uint        `json:"appointment_id"`
	Appointment   *Appointment  `gorm:"foreignKey:AppointmentID" json:"appointment"`

	// TeacherID uint   `json:"teacher_id"`
	// Teacher   Teacher `gorm:"foreignKey:TeacherID" json:"teacher"`

	// StudentID uint    `json:"student_id"`
	// Student   Student `gorm:"foreignKey:StudentID" json:"student"`
}
