package entity

import (
	"time"
	"gorm.io/gorm"
)

type Appointment struct {
	gorm.Model
	StartDateTime    time.Time `json:"start_date_time"`
	DurationMin      uint      `json:"duration_min"`
	AppointmentStatus string   `json:"appointment_status"`

	AppointmentTypeID uint          `json:"appointment_type_id"`
	AppointmentType   *AppointmentType `gorm:"foreignKey:AppointmentTypeID" json:"appointment_type"`

	RoomID uint `json:"room_id"`
	Room   *Room `gorm:"foreignKey:RoomID" json:"room"`

	ScheduleID uint     `json:"schedule_id"`
	Schedule   *Schedule `gorm:"foreignKey:ScheduleID" json:"schedule"`

	GroupProjectID uint          `json:"group_project_id"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`

	EvaResults []EvaResult `gorm:"foreignKey:AppointmentID" json:"eva_results"`
}
