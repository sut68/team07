package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestEvaluation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`True input`, func(t *testing.T) {
		evaluation := &entity.Evaluation{
			Name:              "Final Exam",
			TotalScore:        80,
			ForGroupOnly:      true,
			AppointmentTypeID: 1,
		}

		ok, err := govalidator.ValidateStruct(evaluation)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`Name is required`, func(t *testing.T) {
		evaluation := &entity.Evaluation{
			Name:              "", // ผิดตรงนี้
			TotalScore:        80,
			ForGroupOnly:      true,
			AppointmentTypeID: 1,
		}

		ok, err := govalidator.ValidateStruct(evaluation)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Name is required"))
	})

	t.Run(`TotalScore must be between 0 and 100`, func(t *testing.T) {
		evaluation := &entity.Evaluation{
			Name:              "Final Exam",
			TotalScore:        150, // ผิดตรงนี้
			AppointmentTypeID: 1,
		}

		ok, err := govalidator.ValidateStruct(evaluation)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TotalScore must be between 0 and 100"))
	})

	t.Run(`AppointmentTypeID is required`, func(t *testing.T) {
		evaluation := &entity.Evaluation{
			Name:              "Final Exam",
			TotalScore:        80,
			AppointmentTypeID: 0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(evaluation)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("AppointmentTypeID is required"))
	})
}
