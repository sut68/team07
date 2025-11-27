package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	"github.com/sut68/team07/backend/entity"
	. "github.com/onsi/gomega"
)
func TestAdvisor(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Number must be between 1 and 10`, func(t *testing.T) {
		acstatus := &entity.SelectAdvisor{
			No: 21, // ผิดตรงนี้
			Title: "Test title",
			Description: "Test description",

			GroupProjectID: 1,
			TeacherID: 1,

		}

		ok, err := govalidator.ValidateStruct(acstatus)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Number must be between 1 and 10"))
	})

	t.Run(`Title is required`, func(t *testing.T) {
		acstatus := &entity.SelectAdvisor{
			No: 1,
			Title: "", // ผิดตรงนี้
			Description: "Test description",

			GroupProjectID: 1,
			TeacherID: 1,

		}

		ok, err := govalidator.ValidateStruct(acstatus)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Title is required"))
	})

	t.Run(`Description is required`, func(t *testing.T) {
		acstatus := &entity.SelectAdvisor{
			No: 1,
			Title: "Test Title",
			Description: "", // ผิดตรงนี้

			GroupProjectID: 1,
			TeacherID: 1,

		}

		ok, err := govalidator.ValidateStruct(acstatus)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Description is required"))
	})

	t.Run(`GroupProjectID is required`, func(t *testing.T) {
		acstatus := &entity.SelectAdvisor{
			No: 1,
			Title: "Test Title",
			Description: "Test Description",

			GroupProjectID: 0, // ผิดตรงนี้
			TeacherID: 1,

		}

		ok, err := govalidator.ValidateStruct(acstatus)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GroupProjectID is required"))
	})
	
	t.Run(`TeacherID is required`, func(t *testing.T) {
		acstatus := &entity.SelectAdvisor{
			No: 1,
			Title: "Test Title",
			Description: "Test Description",

			GroupProjectID: 1,
			TeacherID: 0, // ผิดตรงนี้

		}

		ok, err := govalidator.ValidateStruct(acstatus)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TeacherID is required"))
	})
}