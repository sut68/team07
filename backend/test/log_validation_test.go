package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestLog(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`True input`, func(t *testing.T) {
		logger := &entity.Log{
			UserID:       1,
			ActionTypeID: 1,
		}

		ok, err := govalidator.ValidateStruct(logger)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`UserID is required`, func(t *testing.T) {
		logger := &entity.Log{
			UserID:       0, // ผิดตรงนี้
			ActionTypeID: 1,
		}

		ok, err := govalidator.ValidateStruct(logger)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("UserID is required"))
	})

	t.Run(`ActionTypeID is required`, func(t *testing.T) {
		logger := &entity.Log{
			UserID:       1,
			ActionTypeID: 0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(logger)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ActionTypeID is required"))
	})
}
