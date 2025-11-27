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
		topicSelection := &entity.TopicSelection{
			DateSelected:   time.Time{}, // ผิดตรงนี้
			TopicID:        1,
			GroupProjectID: 1,
		}

		ok, err := govalidator.ValidateStruct(topicSelection)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("DateSelected is required"))
	})

	t.Run(`TopicID is required`, func(t *testing.T) {
		topicSelection := &entity.TopicSelection{
			DateSelected:   time.Now().AddDate(-20, 0, 0),
			TopicID:        0, // ผิดตรงนี้
			GroupProjectID: 1,
		}

		ok, err := govalidator.ValidateStruct(topicSelection)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TopicID is required"))
	})

	t.Run(`GroupProjectID is required`, func(t *testing.T) {
		topicSelection := &entity.TopicSelection{
			DateSelected:   time.Now().AddDate(-20, 0, 0),
			TopicID:        1,
			GroupProjectID: 0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(topicSelection)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GroupProjectID is required"))
	})
}
