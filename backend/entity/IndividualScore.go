package entity
import "gorm.io/gorm"

type IndividualScore struct {
	gorm.Model
	Score float64 `json:"score" valid:"required,range(0|100)~Score must be between 0 and 100"`

	CriteriaID uint      `json:"criteria_id" valid:"required~CriteriaID is required"`
	Criteria   *Criteria  `gorm:"foreignKey:CriteriaID" json:"criteria"`

	AppointmentID uint        `json:"appointment_id " valid:"required~AppointmentID is required"`
	Appointment   *Appointment  `gorm:"foreignKey:AppointmentID" json:"appointment"`

	TeacherID uint   `json:"teacher_id" valid:"required~TeacherID is required"`
	Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`

	StudentID uint    `json:"student_id" valid:"required~StudentID is required"`
	Student   *User `gorm:"foreignKey:StudentID" json:"student"`
}
//true