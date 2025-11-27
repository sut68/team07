package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	"github.com/sut68/team07/backend/entity"
	. "github.com/onsi/gomega"
)
func TestGroupMem(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`StudentID is required`, func(t *testing.T) {
		groupMember := &entity.GroupMember{
			StudentID: 0, // ผิดตรงนี้
			GroupProjectID: 1,
		}

		ok, err := govalidator.ValidateStruct(groupMember)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("StudentID is required"))
	})

	t.Run(`GroupProjectID is required`, func(t *testing.T) {
		groupMember := &entity.GroupMember{
			StudentID: 1,
			GroupProjectID: 0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(groupMember)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GroupProjectID is required"))
	})
}