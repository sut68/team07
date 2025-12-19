package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestProgress(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`True input`, func(t *testing.T) {
		progress := &entity.Progress{
			GroupProjectID: 1,
			File:           "progress1.pdf",
			Comment:        "Initial progress submission",
		}

		ok, err := govalidator.ValidateStruct(progress)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`GroupProjectID is required`, func(t *testing.T) {
		progress := &entity.Progress{
			GroupProjectID: 0, // ผิดตรงนี้
			File:           "progress1.pdf",
			Comment:        "Initial progress submission",
		}

		ok, err := govalidator.ValidateStruct(progress)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GroupProjectID is required"))
	})

	t.Run(`File is required`, func(t *testing.T) {
		progress := &entity.Progress{
			GroupProjectID: 1,
			File:           "", // ผิดตรงนี้
			Comment:        "Initial progress submission",
		}

		ok, err := govalidator.ValidateStruct(progress)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("File is required"))
	})

	t.Run(`Comment is required`, func(t *testing.T) {
		progress := &entity.Progress{
			GroupProjectID: 1,
			File:           "progress1.pdf",
			Comment:        "", // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(progress)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Comment is required"))
	})
}
