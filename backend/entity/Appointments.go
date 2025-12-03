package entity

import (
	"time"
	"gorm.io/gorm"
)

type Appointment struct {
	gorm.Model
	StartDateTime    time.Time `json:"start_date_time" valid:"required~StartDateTime is required"`
	DurationMin      uint      `json:"duration_min" valid:"required,range(30|60)~DurationMin must be between 30 and 60"`
	AppointmentStatus string   `json:"appointment_status" valid:"required~AppointmentStatus is required"`

	AppointmentTypeID uint       `json:"appointment_type_id" valid:"required~AppointmentTypeID is required"`
	AppointmentType   *AppointmentType `gorm:"foreignKey:AppointmentTypeID" json:"appointment_type"`
	
	RoomID uint `json:"room_id" valid:"required~RoomID is required"`
	Room   *Room `gorm:"foreignKey:RoomID" json:"room"`

	TeacherID uint  `json:"teacher_id" valid:"required~TeacherID is required"`
	Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`

	GroupProjectID uint         `json:"group_project_id" valid:"required~GroupProjectID is required"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`

	EvaResults []EvaResult `gorm:"foreignKey:AppointmentID" json:"eva_results"`
	IndividualScores []IndividualScore `gorm:"foreignKey:AppointmentID" json:"individual_scores"`
}
