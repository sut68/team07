package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	"github.com/sut68/team07/backend/entity"
	. "github.com/onsi/gomega"
)

func TestCriteria(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Name is required`, func(t *testing.T) {
		criteria := &entity.Criteria{
			Name: "", // ผิดตรงนี้
			MaxScore: 100,
			Order: 1,
			EvaluationID: 1,
		}

		ok, err := govalidator.ValidateStruct(criteria)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Name is required"))
	})

	t.Run(`MaxScore is required and must be between 0 to 100`, func(t *testing.T) {
		criteria := &entity.Criteria{
			Name: "Criteria 1",
			MaxScore: 200, // ผิดตรงนี้
			Order: 1,
			EvaluationID: 1,
		}

		ok, err := govalidator.ValidateStruct(criteria)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("MaxScore is required and must be between 0 to 100"))
	})

	t.Run(`Order is required`, func(t *testing.T) {
		criteria := &entity.Criteria{
			Name: "Criteria 1",
			MaxScore: 100,
			Order: 0, // ผิดตรงนี้
			EvaluationID: 1,
		}

		ok, err := govalidator.ValidateStruct(criteria)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Order is required"))
	})

	t.Run(`EvaluationID is required`, func(t *testing.T) {
		criteria := &entity.Criteria{
			Name: "Criteria 1",
			MaxScore: 100,
			Order: 1,
			EvaluationID: 0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(criteria)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("EvaluationID is required"))
	})
}