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

	t.Run(`Status must be Approved or Rejected`, func(t *testing.T) {
		approval := &entity.TopicApproval{
			Status:       "Pending", // ผิดตรงนี้ - ต้องเป็น Approved หรือ Rejected เท่านั้น
			Comment:      "Good topic",
			ApprovalDate: time.Now(),
			TeacherID:    1,
			TopicID:      1,
		}

		ok, err := govalidator.ValidateStruct(approval)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Invalid status"))
	})

	t.Run(`TeacherID is required`, func(t *testing.T) {
		approval := &entity.TopicApproval{
			Status:       "Approved",
			Comment:      "Good topic",
			ApprovalDate: time.Now(),
			TeacherID:    0, // ผิดตรงนี้
			TopicID:      1,
		}

		ok, err := govalidator.ValidateStruct(approval)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TeacherID is required"))
	})

	t.Run(`TopicID is required`, func(t *testing.T) {
		approval := &entity.TopicApproval{
			Status:       "Approved",
			Comment:      "Good topic",
			ApprovalDate: time.Now(),
			TeacherID:    1,
			TopicID:      0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(approval)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TopicID is required"))
	})

	t.Run(`Valid TopicApproval with Approved status`, func(t *testing.T) {
		approval := &entity.TopicApproval{
			Status:       "Approved",
			Comment:      "Good topic",
			ApprovalDate: time.Now(),
			TeacherID:    1,
			TopicID:      1,
		}

		ok, err := govalidator.ValidateStruct(approval)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`Valid TopicApproval with Rejected status`, func(t *testing.T) {
		approval := &entity.TopicApproval{
			Status:       "Rejected",
			Comment:      "Needs improvement",
			ApprovalDate: time.Now(),
			TeacherID:    1,
			TopicID:      1,
		}

		ok, err := govalidator.ValidateStruct(approval)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}