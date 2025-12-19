package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestUserRole(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`True input`, func(t *testing.T) {
		userrole := &entity.UserRole{
			Role: "Admin",
		}

		ok, err := govalidator.ValidateStruct(userrole)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`Role is required`, func(t *testing.T) {
		userrole := &entity.UserRole{
			Role: "", // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(userrole)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Role is required"))
	})
}
