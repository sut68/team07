package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	"github.com/sut68/team07/backend/entity"
	. "github.com/onsi/gomega"
)
func TestIndividual(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Score must be between 0 and 100`, func(t *testing.T) {
		individual := &entity.IndividualScore{
			Score: 150, // ผิดตรงนี้
			CriteriaID: 1,
			TeacherID: 1,
			StudentID: 1,
		}

		ok, err := govalidator.ValidateStruct(individual)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Score must be between 0 and 100"))
	})

	t.Run(`CriteriaID is required`, func(t *testing.T) {
		individual := &entity.IndividualScore{
			Score: 80,
			CriteriaID: 0, // ผิดตรงนี้
			TeacherID: 1,
			StudentID: 1,
		}

		ok, err := govalidator.ValidateStruct(individual)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("CriteriaID is required"))
	})

	t.Run(`TeacherID is required`, func(t *testing.T) {
		individual := &entity.IndividualScore{
			Score: 80,
			CriteriaID: 1,
			TeacherID: 0, // ผิดตรงนี้
			StudentID: 1,
		}

		ok, err := govalidator.ValidateStruct(individual)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TeacherID is required"))
	})

	t.Run(`StudentID is required`, func(t *testing.T) {
		individual := &entity.IndividualScore{
			Score: 80,
			CriteriaID: 1,
			TeacherID: 1,
			StudentID: 0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(individual)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("StudentID is required"))
	})
}