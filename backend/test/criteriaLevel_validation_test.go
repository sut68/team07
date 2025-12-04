package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	"github.com/sut68/team07/backend/entity"
	. "github.com/onsi/gomega"
)

func TestCriteriaLevel(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Description is required`, func(t *testing.T) {
		criteriaLevel := &entity.CriteriaLevel{
			Description: "", // ผิดตรงนี้
			Score: 50,
			CriteriaID: 1,
		}

		ok, err := govalidator.ValidateStruct(criteriaLevel)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Description is required"))
	})

	t.Run(`Score must be between 0 and 100`, func(t *testing.T) {
		criteriaLevel := &entity.CriteriaLevel{
			Description: "Valid Description",
			Score: 150, // ผิดตรงนี้
			CriteriaID: 1,
		}

		ok, err := govalidator.ValidateStruct(criteriaLevel)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Score must be between 0 and 100"))
	})

	t.Run(`CriteriaID is required`, func(t *testing.T) {
		criteriaLevel := &entity.CriteriaLevel{
			Description: "Valid Description",
			Score: 80,
			CriteriaID: 0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(criteriaLevel)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("CriteriaID is required"))
	})
}