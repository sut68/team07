package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestProjectStorage(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`True input`, func(t *testing.T) {
		proStorage := &entity.ProjectStorage{
			Title:     "Project Storage A",
			Abstract:  "This is abstract content",
			Keywords:  "Golang, Storage",
			Year:      2025,
			FilePath:  "/files/project_a.pdf",
			TeacherID: 1,
		}

		ok, err := govalidator.ValidateStruct(proStorage)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`Title is required`, func(t *testing.T) {
		proStorage := &entity.ProjectStorage{
			Title:     "", // ผิดตรงนี้
			Abstract:  "This is abstract content",
			Keywords:  "Golang, Storage",
			Year:      2025,
			FilePath:  "/files/project_a.pdf",
			TeacherID: 1,
		}

		ok, err := govalidator.ValidateStruct(proStorage)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Title is required"))
	})

	t.Run(`Abstract is required`, func(t *testing.T) {
		proStorage := &entity.ProjectStorage{
			Title:     "Project Storage A",
			Abstract:  "", // ผิดตรงนี้
			Keywords:  "Golang, Storage",
			Year:      2025,
			FilePath:  "/files/project_a.pdf",
			TeacherID: 1,
		}

		ok, err := govalidator.ValidateStruct(proStorage)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Abstract is required"))
	})

	t.Run(`Keywords is required`, func(t *testing.T) {
		proStorage := &entity.ProjectStorage{
			Title:     "Project Storage A",
			Abstract:  "This is abstract content",
			Keywords:  "", // ผิดตรงนี้
			Year:      2025,
			FilePath:  "/files/project_a.pdf",
			TeacherID: 1,
		}

		ok, err := govalidator.ValidateStruct(proStorage)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Keywords is required"))
	})

	t.Run(`Year must be between 2000 and 2100`, func(t *testing.T) {
		proStorage := &entity.ProjectStorage{
			Title:     "Project Storage A",
			Abstract:  "This is abstract content",
			Keywords:  "Golang, Storage",
			Year:      1999, // ผิดตรงนี้
			FilePath:  "/files/project_a.pdf",
			TeacherID: 1,
		}

		ok, err := govalidator.ValidateStruct(proStorage)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Year must be between 2000 and 2100"))
	})

	t.Run(`FilePath is required`, func(t *testing.T) {
		proStorage := &entity.ProjectStorage{
			Title:     "Project Storage A",
			Abstract:  "This is abstract content",
			Keywords:  "Golang, Storage",
			Year:      2025,
			FilePath:  "", // ผิดตรงนี้
			TeacherID: 1,
		}

		ok, err := govalidator.ValidateStruct(proStorage)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("FilePath is required"))
	})

	t.Run(`TeacherID is required`, func(t *testing.T) {
		proStorage := &entity.ProjectStorage{
			Title:     "Project Storage A",
			Abstract:  "This is abstract content",
			Keywords:  "Golang, Storage",
			Year:      2025,
			FilePath:  "/files/project_a.pdf",
			TeacherID: 0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(proStorage)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TeacherID is required"))
	})
}
