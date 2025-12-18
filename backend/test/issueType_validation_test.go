package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestIssueType(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`True input`, func(t *testing.T) {
		issuetype := &entity.IssueType{
			Type: "Bug",
		}

		ok, err := govalidator.ValidateStruct(issuetype)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`Type is required`, func(t *testing.T) {
		issuetype := &entity.IssueType{
			Type: "", // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(issuetype)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Type is required"))
	})
}
