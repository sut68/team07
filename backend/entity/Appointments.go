package entity

import (
	"time"
	"gorm.io/gorm"
)

type Appointment struct {
	gorm.Model
	StartDateTime    time.Time `json:"start_date_time" valid:"required~StartDateTime is required"`
	DurationMin      uint      `json:"duration_min" valid:"required,range(60|600)~DurationMin must be between 60 and 600"`
	AppointmentStatus string   `json:"appointment_status" valid:"required~AppointmentStatus is required"`

	AppointmentTypeID uint       `json:"appointment_type_id" valid:"required~AppointmentTypeID is required"`
	AppointmentType   *AppointmentType `gorm:"foreignKey:AppointmentTypeID" json:"appointment_type"`

	RoomID uint `json:"room_id" valid:"required~RoomID is required"`
	Room   *Room `gorm:"foreignKey:RoomID" json:"room"`

	ScheduleID uint     `json:"schedule_id" valid:"required~ScheduleID is required"`
	Schedule   *Schedule `gorm:"foreignKey:ScheduleID" json:"schedule"`

	GroupMemberID uint         `json:"group_member_id" valid:"required~GroupMemberID is required"`
	GroupMember   *GroupMember `gorm:"foreignKey:GroupMemberID" json:"group_member"`

	EvaResults []EvaResult `gorm:"foreignKey:AppointmentID" json:"eva_results"`
	IndividualScores []IndividualScore `gorm:"foreignKey:AppointmentID" json:"individual_scores"`
}
