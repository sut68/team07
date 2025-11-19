package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	"github.com/sut68/team07/backend/entity"
	. "github.com/onsi/gomega"
)

func TestUser(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Test something`, func(t *testing.T) {
		users := &entity.User{
			Username: "",
			Password:  "",
			Firstname:     "",
			Lastname:   "",
			Email: "",
			Phone: "",
			Pass:   nil,
		}

		ok, err := govalidator.ValidateStruct(users)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
