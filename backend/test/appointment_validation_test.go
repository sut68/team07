package test

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestAppointment(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`StartDateTime is required`, func(t *testing.T) {
		appointment := &entity.Appointment{
			StartDateTime:     time.Time{}, // ผิดตรงนี้
			DurationMin:       60,
			AppointmentStatus: "confirmed",
			AppointmentTypeID: 1,
			RoomID:            1,
			ScheduleID:        1,
			GroupMemberID:     1,
		}

		ok, err := govalidator.ValidateStruct(appointment)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("StartDateTime is required"))
	})

	t.Run(`DurationMin must be between 60 and 600`, func(t *testing.T) {
		appointment := &entity.Appointment{
			StartDateTime: time.Now().AddDate(-20, 0, 0),
			DurationMin: 20, // ผิดตรงนี้
			AppointmentStatus: "confirmed",
			AppointmentTypeID: 1,
			RoomID: 1,
			ScheduleID: 1,
			GroupMemberID: 1,
		}

		ok, err := govalidator.ValidateStruct(appointment)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("DurationMin must be between 60 and 600"))
	})

	t.Run(`AppointmentStatus is required`, func(t *testing.T) {
		appointment := &entity.Appointment{
			StartDateTime: time.Now().AddDate(-20, 0, 0),
			DurationMin: 60,
			AppointmentStatus: "", // ผิดตรงนี้
			AppointmentTypeID: 1,
			RoomID: 1,
			ScheduleID: 1,
			GroupMemberID: 1,
		}

		ok, err := govalidator.ValidateStruct(appointment)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("AppointmentStatus is required"))
	})

	t.Run(`AppointmentTypeID is required`, func(t *testing.T) {
		appointment := &entity.Appointment{
			StartDateTime: time.Now().AddDate(-20, 0, 0),
			DurationMin: 60,
			AppointmentStatus: "confirmed",
			AppointmentTypeID: 0, // ผิดตรงนี้
			RoomID: 1,
			ScheduleID: 1,
			GroupMemberID: 1,
		}

		ok, err := govalidator.ValidateStruct(appointment)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("AppointmentTypeID is required"))
	})

	t.Run(`RoomID is required`, func(t *testing.T) {
		appointment := &entity.Appointment{
			StartDateTime: time.Now().AddDate(-20, 0, 0),
			DurationMin: 60,
			AppointmentStatus: "confirmed",
			AppointmentTypeID: 1,
			RoomID: 0, // ผิดตรงนี้
			ScheduleID: 1,
			GroupMemberID: 1,
		}

		ok, err := govalidator.ValidateStruct(appointment)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("RoomID is required"))
	})

	t.Run(`ScheduleID is required`, func(t *testing.T) {
		appointment := &entity.Appointment{
			StartDateTime: time.Now().AddDate(-20, 0, 0),
			DurationMin: 60,
			AppointmentStatus: "confirmed",
			AppointmentTypeID: 1,
			RoomID: 1,
			ScheduleID: 0, // ผิดตรงนี้
			GroupMemberID: 1,
		}

		ok, err := govalidator.ValidateStruct(appointment)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ScheduleID is required"))
	})

	t.Run(`GroupMemberID is required`, func(t *testing.T) {
		appointment := &entity.Appointment{
			StartDateTime: time.Now().AddDate(-20, 0, 0),
			DurationMin: 60,
			AppointmentStatus: "confirmed",
			AppointmentTypeID: 1,
			RoomID: 1,
			ScheduleID: 1,
			GroupMemberID: 0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(appointment)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GroupMemberID is required"))
	})
}
