package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	"github.com/sut68/team07/backend/entity"
	. "github.com/onsi/gomega"
)
func TestIssueStatus(t *testing.T) {
	g := NewGomegaWithT(t)

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