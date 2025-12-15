package test

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestTopicApproval(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Status is required`, func(t *testing.T) {
		topicApproval := &entity.TopicApproval{
			Status:       "", // ผิดตรงนี้
			Comment:      "Good Job",
			ApprovalDate: time.Now().AddDate(-20, 0, 0),
			TeacherID:    1,
			TopicID:      1,
		}

		ok, err := govalidator.ValidateStruct(topicApproval)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Status is required"))
	})

	t.Run(`Comment is required`, func(t *testing.T) {
		topicApproval := &entity.TopicApproval{
			Status:       "Approved",
			Comment:      "", // ผิดตรงนี้
			ApprovalDate: time.Now().AddDate(-20, 0, 0),
			TeacherID:    1,
			TopicID:      1,
		}

		ok, err := govalidator.ValidateStruct(topicApproval)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Comment is required"))
	})

	t.Run(`ApprovalDate is required`, func(t *testing.T) {
		topicApproval := &entity.TopicApproval{
			Status:       "Approved",
			Comment:      "Good Job",
			ApprovalDate: time.Time{}, // ผิดตรงนี้
			TeacherID:    1,
			TopicID:      1,
		}

		ok, err := govalidator.ValidateStruct(topicApproval)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ApprovalDate is required"))
	})

	t.Run(`TeacherID is required`, func(t *testing.T) {
		topicApproval := &entity.TopicApproval{
			Status:       "Approved",
			Comment:      "Good Job",
			ApprovalDate: time.Now().AddDate(-20, 0, 0),
			TeacherID:    0, // ผิดตรงนี้
			TopicID:      1,
		}

		ok, err := govalidator.ValidateStruct(topicApproval)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TeacherID is required"))
	})

	t.Run(`TopicID is required`, func(t *testing.T) {
		topicApproval := &entity.TopicApproval{
			Status:       "Approved",
			Comment:      "Good Job",
			ApprovalDate: time.Now().AddDate(-20, 0, 0),
			TeacherID:    1,
			TopicID:      0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(topicApproval)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TopicID is required"))
	})
}