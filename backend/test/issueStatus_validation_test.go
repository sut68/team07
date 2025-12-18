package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestIssueStatus(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`True input`, func(t *testing.T) {
		issuestatus := &entity.IssueStatus{
			Status: "Open",
		}

		ok, err := govalidator.ValidateStruct(issuestatus)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`Status is required`, func(t *testing.T) {
		issuestatus := &entity.IssueStatus{
			Status: "", // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(issuestatus)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Status is required"))
	})
}
