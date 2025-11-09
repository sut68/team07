package entity
import (
	"time"

	"gorm.io/gorm"
)

type Schedule struct {
	gorm.Model
	DayOfWeek     int       `json:"day_of_week"`
	StartTime     string    `json:"start_time"`
	EndTime       string    `json:"end_time"`
	EffectiveDate time.Time `json:"effective_date"`
	ExpiryDate    time.Time `json:"expiry_date"`

	Appointments []Appointment `gorm:"foreignKey:ScheduleID" json:"appointments"`
}
