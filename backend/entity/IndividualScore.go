package entity

import "gorm.io/gorm"

type IndividualScore struct {
	gorm.Model
	Score float64 `json:"score" valid:"required,range(0|100)~Score must be between 0 and 100"`

	CriteriaID uint      `json:"criteria_id" valid:"required~CriteriaID is required"`
	Criteria   *Criteria `gorm:"foreignKey:CriteriaID" json:"criteria"`

	CriteriaLevelID *uint          `json:"criteria_level_id"`
	CriteriaLevel   *CriteriaLevel `gorm:"foreignKey:CriteriaLevelID" json:"criteria_level"`
	
	AppointmentID *uint        `json:"appointment_id"`
	Appointment   *Appointment `gorm:"foreignKey:AppointmentID" json:"appointment"`

	TeacherID *uint    `json:"teacher_id"` 
	Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`

	StudentEvaluatorID *uint    `json:"student_evaluator_id"`
	StudentEvaluator   *User `gorm:"foreignKey:StudentEvaluatorID" json:"student_evaluator"`

	StudentID uint  `json:"student_id" valid:"required~StudentID is required"`
	Student   *User `gorm:"foreignKey:StudentID" json:"student"`
}
