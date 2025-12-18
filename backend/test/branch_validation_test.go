package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestBranch(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`True input`, func(t *testing.T) {
		branch := &entity.Branch{
			BranchName: "Test Branch",
		}

		ok, err := govalidator.ValidateStruct(branch)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

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
