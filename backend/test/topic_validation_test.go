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
			Title:        "", // ผิดตรงนี้
			Objective:    "Objective",
			Scope:        "Scope",
			Description:  "Description about the topic",
			Status:       "Pending",
			ProposerRole: "Teacher",
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Title is required"))
	})

	t.Run(`Objective is required`, func(t *testing.T) {
		topic := &entity.Topic{
			Title:        "System Analysis Topic",
			Objective:    "", // ผิดตรงนี้
			Scope:        "Scope",
			Description:  "Description about the topic",
			Status:       "Pending",
			ProposerRole: "Teacher",
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Objective is required"))
	})

	t.Run(`Scope is required`, func(t *testing.T) {
		topic := &entity.Topic{
			Title:        "System Analysis Topic",
			Objective:    "Objective",
			Scope:        "", // ผิดตรงนี้
			Description:  "Description about the topic",
			Status:       "Pending",
			ProposerRole: "Teacher",
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Scope is required"))
	})

	t.Run(`Status must be valid`, func(t *testing.T) {
		topic := &entity.Topic{
			Title:        "System Analysis Topic",
			Objective:    "Objective",
			Scope:        "Scope",
			Description:  "Description about the topic",
			Status:       "InvalidStatus", // ผิดตรงนี้
			ProposerRole: "Teacher",
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Invalid status"))
	})

	t.Run(`ProposerRole must be valid`, func(t *testing.T) {
		topic := &entity.Topic{
			Title:        "System Analysis Topic",
			Objective:    "Objective",
			Scope:        "Scope",
			Description:  "Description about the topic",
			Status:       "Pending",
			ProposerRole: "InvalidRole", // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Invalid proposer role"))
	})

	t.Run(`Valid Topic`, func(t *testing.T) {
		topic := &entity.Topic{
			Title:        "System Analysis Topic",
			Objective:    "Objective",
			Scope:        "Scope",
			Description:  "Description about the topic",
			Status:       "Pending",
			ProposerRole: "Teacher",
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}