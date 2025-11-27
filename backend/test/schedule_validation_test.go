package test

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestSchedule(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`DayOfWeek must be between 1 and 7`, func(t *testing.T) {
		schedule := &entity.Schedule{
			DayOfWeek:     8, // ผิดตรงนี้
			StartTime:     "09:00",
			EndTime:       "10:00",
			EffectiveDate: time.Now().AddDate(-20, 0, 0),
			ExpiryDate:    time.Now().AddDate(-20, 0, 0),
			ScheduleType:  "Lecture",
			TeacherID:     1,
		}

		ok, err := govalidator.ValidateStruct(schedule)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("DayOfWeek must be between 1 and 7"))
	})

	t.Run(`StartTime is required`, func(t *testing.T) {
		schedule := &entity.Schedule{
			DayOfWeek:     4,
			StartTime:     "", // ผิดตรงนี้
			EndTime:       "10:00",
			EffectiveDate: time.Now().AddDate(-20, 0, 0),
			ExpiryDate:    time.Now().AddDate(-20, 0, 0),
			ScheduleType:  "Lecture",
			TeacherID:     1,
		}

		ok, err := govalidator.ValidateStruct(schedule)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("StartTime is required"))
	})

	t.Run(`EndTime is required`, func(t *testing.T) {
		schedule := &entity.Schedule{
			DayOfWeek:     4,
			StartTime:     "9:00",
			EndTime:       "", // ผิดตรงนี้
			EffectiveDate: time.Now().AddDate(-20, 0, 0),
			ExpiryDate:    time.Now().AddDate(-20, 0, 0),
			ScheduleType:  "Lecture",
			TeacherID:     1,
		}

		ok, err := govalidator.ValidateStruct(schedule)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("EndTime is required"))
	})

	t.Run(`EffectiveDate is required`, func(t *testing.T) {
		schedule := &entity.Schedule{
			DayOfWeek:     4,
			StartTime:     "9:00",
			EndTime:       "10:00",
			EffectiveDate: time.Time{}, // ผิดตรงนี้
			ExpiryDate:    time.Now().AddDate(-20, 0, 0),
			ScheduleType:  "Lecture",
			TeacherID:     1,
		}

		ok, err := govalidator.ValidateStruct(schedule)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("EffectiveDate is required"))
	})

	t.Run(`ExpiryDate is required`, func(t *testing.T) {
		schedule := &entity.Schedule{
			DayOfWeek:     4,
			StartTime:     "9:00",
			EndTime:       "10:00",
			EffectiveDate: time.Now().AddDate(-20, 0, 0),
			ExpiryDate:    time.Time{}, // ผิดตรงนี้
			ScheduleType:  "Lecture",
			TeacherID:     1,
		}

		ok, err := govalidator.ValidateStruct(schedule)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ExpiryDate is required"))
	})

	t.Run(`ScheduleType is required`, func(t *testing.T) {
		schedule := &entity.Schedule{
			DayOfWeek:     4,
			StartTime:     "9:00",
			EndTime:       "10:00",
			EffectiveDate: time.Now().AddDate(-20, 0, 0),
			ExpiryDate:    time.Now().AddDate(-20, 0, 0),
			ScheduleType:  "", // ผิดตรงนี้
			TeacherID:     1,
		}

		ok, err := govalidator.ValidateStruct(schedule)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ScheduleType is required"))
	})

	t.Run(`TeacherID is required`, func(t *testing.T) {
		schedule := &entity.Schedule{
			DayOfWeek:     4,
			StartTime:     "9:00",
			EndTime:       "10:00",
			EffectiveDate: time.Now().AddDate(-20, 0, 0),
			ExpiryDate:    time.Now().AddDate(-20, 0, 0),
			ScheduleType:  "Lecture",
			TeacherID:     0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(schedule)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TeacherID is required"))
	})
}
