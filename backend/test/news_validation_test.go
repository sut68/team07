package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestNews(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`True input`, func(t *testing.T) {
		news := &entity.News{
			Title: "Sample News",
			Description: "This is a sample news description.",
			Category: "General",
		}

		ok, err := govalidator.ValidateStruct(news)
		
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`Title is required`, func(t *testing.T) {
		news := &entity.News{
			Title: "", // ผิดตรงนี้
			Description: "This is a sample news description.",
			Category: "General",
		}

		ok, err := govalidator.ValidateStruct(news)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Title is required"))
	})

	t.Run(`Description is required`, func(t *testing.T) {
		news := &entity.News{
			Title: "Sample News",
			Description: "", // ผิดตรงนี้
			Category: "General",
		}

		ok, err := govalidator.ValidateStruct(news)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Description is required"))
	})
	t.Run(`Category is required`, func(t *testing.T) {
		news := &entity.News{
			Title: "Sample News",
			Description: "This is a sample news description.",
			Category: "", // ผิดตรงนี้
		}
		ok, err := govalidator.ValidateStruct(news)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Category is required"))
	})
}