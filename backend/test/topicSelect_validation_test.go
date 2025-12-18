package test

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestTopicSelection(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`DateSelected is required`, func(t *testing.T) {
		selection := &entity.TopicSelection{
			DateSelected:   time.Time{}, // ผิดตรงนี้ - zero value
			TopicID:        1,
			GroupProjectID: 1,
			Status:         "Active",
		}

		ok, err := govalidator.ValidateStruct(selection)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("DateSelected is required"))
	})

	t.Run(`TopicID is required`, func(t *testing.T) {
		selection := &entity.TopicSelection{
			DateSelected:   time.Now(),
			TopicID:        0, // ผิดตรงนี้
			GroupProjectID: 1,
			Status:         "Active",
		}

		ok, err := govalidator.ValidateStruct(selection)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TopicID is required"))
	})

	t.Run(`GroupProjectID is required`, func(t *testing.T) {
		selection := &entity.TopicSelection{
			DateSelected:   time.Now(),
			TopicID:        1,
			GroupProjectID: 0, // ผิดตรงนี้
			Status:         "Active",
		}

		ok, err := govalidator.ValidateStruct(selection)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GroupProjectID is required"))
	})

	t.Run(`Status is required`, func(t *testing.T) {
		selection := &entity.TopicSelection{
			DateSelected:   time.Now(),
			TopicID:        1,
			GroupProjectID: 1,
			Status:         "", // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(selection)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Status is required"))
	})

	t.Run(`Valid TopicSelection with Active status`, func(t *testing.T) {
		selection := &entity.TopicSelection{
			DateSelected:   time.Now(),
			TopicID:        1,
			GroupProjectID: 1,
			Status:         "Active",
		}

		ok, err := govalidator.ValidateStruct(selection)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`Valid TopicSelection with Cancelled status`, func(t *testing.T) {
		selection := &entity.TopicSelection{
			DateSelected:   time.Now(),
			TopicID:        1,
			GroupProjectID: 1,
			Status:         "Cancelled",
		}

		ok, err := govalidator.ValidateStruct(selection)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
