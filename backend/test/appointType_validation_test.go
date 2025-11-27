package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	"github.com/sut68/team07/backend/entity"
	. "github.com/onsi/gomega"
)
func TestAppointmentType(t *testing.T) {
	g := NewGomegaWithT(t)

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