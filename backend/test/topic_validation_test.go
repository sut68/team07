package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestTopic(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Title is required`, func(t *testing.T) {
		topic := &entity.Topic{
			Title:          "", // ผิดตรงนี้
			Description:    "Description about the topic",
			Status:         "Pending",
			Proposer_role:  "Student",
			GroupProjectID: 1,
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Title is required"))
	})

	t.Run(`Description is required`, func(t *testing.T) {
		topic := &entity.Topic{
			Title:          "System Analysis Topic",
			Description:    "", // ผิดตรงนี้
			Status:         "Pending",
			Proposer_role:  "Student",
			GroupProjectID: 1,
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Description is required"))
	})

	t.Run(`Status is required`, func(t *testing.T) {
		topic := &entity.Topic{
			Title:          "System Analysis Topic",
			Description:    "Description about the topic",
			Status:         "", // ผิดตรงนี้
			Proposer_role:  "Student",
			GroupProjectID: 1,
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Status is required"))
	})

	t.Run(`ProposerRole is required`, func(t *testing.T) {
		topic := &entity.Topic{
			Title:          "System Analysis Topic",
			Description:    "Description about the topic",
			Status:         "Pending",
			Proposer_role:  "", // ผิดตรงนี้
			GroupProjectID: 1,
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ProposerRole is required"))
	})

	t.Run(`GroupProjectID is required`, func(t *testing.T) {
		topic := &entity.Topic{
			Title:          "System Analysis Topic",
			Description:    "Description about the topic",
			Status:         "Pending",
			Proposer_role:  "Student",
			GroupProjectID: 0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GroupProjectID is required"))
	})
}