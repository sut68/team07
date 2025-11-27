package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	"github.com/sut68/team07/backend/entity"
	. "github.com/onsi/gomega"
)
func TestGroupPro(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`GroupNumber must be between 1 and 40`, func(t *testing.T) {
		groupProject := &entity.GroupProject{
			GroupNumber: 50, // ผิดตรงนี้
			GroupStatus: "In Process",
			Membership: 5,
			TeacherID: 1,
		}

		ok, err := govalidator.ValidateStruct(groupProject)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GroupNumber must be between 1 and 40"))
	})

	t.Run(`GroupStatus is required`, func(t *testing.T) {
		groupProject := &entity.GroupProject{
			GroupNumber: 10,
			GroupStatus: "", // ผิดตรงนี้
			Membership: 5,
			TeacherID: 1,
		}

		ok, err := govalidator.ValidateStruct(groupProject)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GroupStatus is required"))
	})

	t.Run(`Membership must be between 1 and 5`, func(t *testing.T) {
		groupProject := &entity.GroupProject{
			GroupNumber: 25,
			GroupStatus: "In Process",
			Membership: 10, // ผิดตรงนี้
			TeacherID: 1,
		}

		ok, err := govalidator.ValidateStruct(groupProject)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Membership must be between 1 and 5"))
	})

	t.Run(`TeacherID is required`, func(t *testing.T) {
		groupProject := &entity.GroupProject{
			GroupNumber: 25,
			GroupStatus: "In Process",
			Membership: 5,
			TeacherID: 0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(groupProject)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TeacherID is required"))
	})
}