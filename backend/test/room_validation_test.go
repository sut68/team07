package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestRoom(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`True input`, func(t *testing.T) {
		room := &entity.Room{
			Name:     "ห้องประชุม A",
			Location: "เรียนรวม 1",
			Capacity: 100,
		}

		ok, err := govalidator.ValidateStruct(room)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`Name is required`, func(t *testing.T) {
		room := &entity.Room{
			Name:     "", // ผิดตรงนี้
			Location: "เรียนรวม 1",
			Capacity: 1500,
		}

		ok, err := govalidator.ValidateStruct(room)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Name is required"))
	})

	t.Run(`Location is required`, func(t *testing.T) {
		room := &entity.Room{
			Name:     "ห้องประชุม A",
			Location: "", // ผิดตรงนี้
			Capacity: 100,
		}

		ok, err := govalidator.ValidateStruct(room)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Location is required"))
	})

	t.Run(`Capacity must be between 1 and 1500`, func(t *testing.T) {
		room := &entity.Room{
			Name:     "ห้องประชุม A",
			Location: "เรียนรวม 1",
			Capacity: 1600, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(room)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Capacity must be between 1 and 1500"))
	})
}
