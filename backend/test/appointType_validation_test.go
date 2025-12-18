package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestAppointmentType(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`True input`, func(t *testing.T) {
		appointmentType := &entity.AppointmentType{
			Name: "Test Appointment Type",
		}

		ok, err := govalidator.ValidateStruct(appointmentType)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`Name is required`, func(t *testing.T) {
		appointmentType := &entity.AppointmentType{
			Name: "", // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(appointmentType)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Name is required"))
	})
}
