package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestNotification(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`True input`, func(t *testing.T) {
		notification := &entity.Notification{
			Title:   "Sample Notification",
			Message: "This is a sample notification message.", 
		}

		ok, err := govalidator.ValidateStruct(notification)
		
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`Title is required`, func(t *testing.T) {
		notification := &entity.Notification{
			Title: "", // ผิดตรงนี้
			Message: "This is a sample notification message.",
		}

		ok, err := govalidator.ValidateStruct(notification)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Title is required"))
	})
	t.Run(`Message is required`, func(t *testing.T) {
		notification := &entity.Notification{
			Title: "Sample Notification",
			Message: "", // ผิดตรงนี้
		}
		ok, err := govalidator.ValidateStruct(notification)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Message is required"))
	})
}