package test

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)
func TestEvaResult(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Score must be between 0 and 100`, func(t *testing.T) {
		evaResult := &entity.EvaResult{
			Score: 150, // ผิดตรงนี้
			Date: time.Now().AddDate(-20, 0, 0),
			CriteriaID: 1,
			AppointmentID: 1,
			TeacherID: 1,
		}

		ok, err := govalidator.ValidateStruct(evaResult)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Score must be between 0 and 100"))
	})

	t.Run(`Date is required`, func(t *testing.T) {
		evaResult := &entity.EvaResult{
			Score: 100,
			Date: time.Time{}, // ผิดตรงนี้
			CriteriaID: 1,
			AppointmentID: 1,
			TeacherID: 1,
		}

		ok, err := govalidator.ValidateStruct(evaResult)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Date is required"))
	})

	t.Run(`CriteriaID is required`, func(t *testing.T) {
		evaResult := &entity.EvaResult{
			Score: 100,
			Date: time.Now().AddDate(-20, 0, 0),
			CriteriaID: 0, // ผิดตรงนี้
			AppointmentID: 1,
			TeacherID: 1,
		}

		ok, err := govalidator.ValidateStruct(evaResult)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("CriteriaID is required"))
	})

	t.Run(`AppointmentID is required`, func(t *testing.T) {
		evaResult := &entity.EvaResult{
			Score: 100,
			Date: time.Now().AddDate(-20, 0, 0),
			CriteriaID: 1,
			AppointmentID: 0, // ผิดตรงนี้
			TeacherID: 1,
		}

		ok, err := govalidator.ValidateStruct(evaResult)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("AppointmentID is required"))
	})

	t.Run(`TeacherID is required`, func(t *testing.T) {
		evaResult := &entity.EvaResult{
			Score: 100,
			Date: time.Now().AddDate(-20, 0, 0),
			CriteriaID: 1,
			AppointmentID: 1,
			TeacherID: 0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(evaResult)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TeacherID is required"))
	})
}