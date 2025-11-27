package entity
import (
	"time"

	"gorm.io/gorm"
)

type Schedule struct {
	gorm.Model
	DayOfWeek     int       `json:"day_of_week" valid:"required,range(1|7)~DayOfWeek must be between 1 and 7"`
	StartTime     string    `json:"start_time" valid:"required~StartTime is required"`
	EndTime       string    `json:"end_time" valid:"required~EndTime is required"`
	EffectiveDate time.Time `json:"effective_date" valid:"required~EffectiveDate is required"`
	ExpiryDate    time.Time `json:"expiry_date" valid:"required~ExpiryDate is required"`
	ScheduleType  string    `json:"schedule_type" valid:"required~ScheduleType is required"`
	TeacherID     uint      `json:"teacher_id" valid:"required~TeacherID is required"`
	Teacher       *User     `gorm:"foreignKey:TeacherID" json:"teacher"`
}

//true
