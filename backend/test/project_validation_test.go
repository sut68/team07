package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestProject(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Title is required`, func(t *testing.T) {
		project := &entity.Project{
			Title:       "", // ผิดตรงนี้
			Abstract:    "This is abstract",
			Keywords:    "Golang, Testing",
			Year:        2025,
			Status:      "Pending",
			FilePath:    "/path/to/file.pdf",
			SelectionID: 1,
		}

		ok, err := govalidator.ValidateStruct(project)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Title is required"))
	})

	t.Run(`Abstract is required`, func(t *testing.T) {
		project := &entity.Project{
			Title:       "Project A",
			Abstract:    "", // ผิดตรงนี้
			Keywords:    "Golang, Testing",
			Year:        2025,
			Status:      "Pending",
			FilePath:    "/path/to/file.pdf",
			SelectionID: 1,
		}

		ok, err := govalidator.ValidateStruct(project)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Abstract is required"))
	})

	t.Run(`Keywords is required`, func(t *testing.T) {
		project := &entity.Project{
			Title:       "Project A",
			Abstract:    "This is abstract",
			Keywords:    "", // ผิดตรงนี้
			Year:        2025,
			Status:      "Pending",
			FilePath:    "/path/to/file.pdf",
			SelectionID: 1,
		}

		ok, err := govalidator.ValidateStruct(project)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Keywords is required"))
	})

	t.Run(`Year must be between 2000 and 2100`, func(t *testing.T) {
		project := &entity.Project{
			Title:       "Project A",
			Abstract:    "This is abstract",
			Keywords:    "Golang, Testing",
			Year:        1999, // ผิดตรงนี้
			Status:      "Pending",
			FilePath:    "/path/to/file.pdf",
			SelectionID: 1,
		}

		ok, err := govalidator.ValidateStruct(project)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Year must be between 2000 and 2100"))
	})

	t.Run(`Status is required`, func(t *testing.T) {
		project := &entity.Project{
			Title:       "Project A",
			Abstract:    "This is abstract",
			Keywords:    "Golang, Testing",
			Year:        2025,
			Status:      "", // ผิดตรงนี้
			FilePath:    "/path/to/file.pdf",
			SelectionID: 1,
		}

		ok, err := govalidator.ValidateStruct(project)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Status is required"))
	})

	t.Run(`FilePath is required`, func(t *testing.T) {
		project := &entity.Project{
			Title:       "Project A",
			Abstract:    "This is abstract",
			Keywords:    "Golang, Testing",
			Year:        2025,
			Status:      "Pending",
			FilePath:    "", // ผิดตรงนี้
			SelectionID: 1,
		}

		ok, err := govalidator.ValidateStruct(project)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("FilePath is required"))
	})

	t.Run(`SelectionID is required`, func(t *testing.T) {
		project := &entity.Project{
			Title:       "Project A",
			Abstract:    "This is abstract",
			Keywords:    "Golang, Testing",
			Year:        2025,
			Status:      "Pending",
			FilePath:    "/path/to/file.pdf",
			SelectionID: 0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(project)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("SelectionID is required"))
	})
}