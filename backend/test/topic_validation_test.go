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
			Objective:      "Objective",
			Scope:          "Scope",
			Description:    "Description about the topic",
			Status:         "Pending",
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Title is required"))
	})

	t.Run(`Objective is required`, func(t *testing.T) {
		topic := &entity.Topic{
			Title:          "System Analysis Topic",
			Objective:      "", // ผิดตรงนี้
			Scope:          "Scope",
			Description:    "Description about the topic",
			Status:         "Pending",
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Objective is required"))
	})

	t.Run(`Scope is required`, func(t *testing.T) {
		topic := &entity.Topic{
			Title:          "System Analysis Topic",
			Objective:      "Objective",
			Scope:          "", // ผิดตรงนี้
			Description:    "Description about the topic",
			Status:         "Pending",
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Scope is required"))
	})

	t.Run(`Description is required`, func(t *testing.T) {
		topic := &entity.Topic{
			Title:          "System Analysis Topic",
			Objective:      "Objective",
			Scope:          "Scope",
			Description:    "", // ผิดตรงนี้
			Status:         "Pending",
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Description is required"))
	})

	t.Run(`Status is required`, func(t *testing.T) {
		topic := &entity.Topic{
			Title:          "System Analysis Topic",
			Objective:      "Objective",
			Scope:          "Scope",
			Description:    "Description about the topic",
			Status:         "", // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(topic)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Status is required"))
	})


}