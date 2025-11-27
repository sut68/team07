package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	"github.com/sut68/team07/backend/entity"
	. "github.com/onsi/gomega"
)
func TestBranch(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`BranchName is required`, func(t *testing.T) {
		branch := &entity.Branch{
			BranchName: "", // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(branch)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("BranchName is required"))
	})
}