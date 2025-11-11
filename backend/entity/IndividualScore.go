package entity
import "gorm.io/gorm"

type IndividualScore struct {
	gorm.Model
	Score float64 `json:"score"`

	CriteriaID uint      `json:"criteria_id"`
	Criteria   *Criteria  `gorm:"foreignKey:CriteriaID" json:"criteria"`

	AppointmentID uint        `json:"appointment_id"`
	Appointment   *Appointment  `gorm:"foreignKey:AppointmentID" json:"appointment"`

	TeacherID uint   `json:"teacher_id"`
	Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`

	StudentID uint    `json:"student_id"`
	Student   *User `gorm:"foreignKey:StudentID" json:"student"`
}
