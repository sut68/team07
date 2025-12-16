package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	"github.com/sut68/team07/backend/entity"
	. "github.com/onsi/gomega"
)
func TestChat(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Message is required`, func(t *testing.T) {
		chat := &entity.Chat{
			GroupProjectID: 1,
			ProcessID: 1,
			SenderID: 1,
			Message: "", // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(chat)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Message is required"))
	})

	t.Run(`Message is required`, func(t *testing.T) {
		chat := &entity.Chat{
			GroupProjectID: 1,
			ProcessID: 1,
			SenderID: 1,
			Message: "", // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(chat)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Message is required"))
	})

	t.Run(`GroupProjectID is required`, func(t *testing.T) {
		chat := &entity.Chat{
			GroupProjectID: 0, // ผิดตรงนี้
			ProcessID: 1,
			SenderID: 1,
			Message: "Hello world",
		}

		ok, err := govalidator.ValidateStruct(chat)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GroupMemberID is required"))
	})

	t.Run(`ProcessID is required`, func(t *testing.T) {
		chat := &entity.Chat{
			GroupProjectID: 1,
			ProcessID: 0, // ผิดตรงนี้
			SenderID: 1,
			Message: "Hello world",
		}

		ok, err := govalidator.ValidateStruct(chat)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ProcessID is required"))
	})

	t.Run(`SenderID is required`, func(t *testing.T) {
		chat := &entity.Chat{
			GroupProjectID: 1,
			ProcessID: 1,
			SenderID: 0, // ผิดตรงนี้
			Message: "Hello world",
		}

		ok, err := govalidator.ValidateStruct(chat)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("SenderID is required"))
	})

}