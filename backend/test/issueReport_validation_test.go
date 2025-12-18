package test

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestIssueReport(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`True input`, func(t *testing.T) {
		issueReport := &entity.IssueReport{
			Detail:     "Issue 1",
			ReportDate: time.Now().AddDate(-20, 0, 0),
			StatusID:   1,
			TypeID:     1,
			UserID:     1,
		}

		ok, err := govalidator.ValidateStruct(issueReport)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`Detail is required`, func(t *testing.T) {
		issueReport := &entity.IssueReport{
			Detail:     "", // ผิดตรงนี้
			ReportDate: time.Now().AddDate(-20, 0, 0),
			StatusID:   1,
			TypeID:     1,
			UserID:     1,
		}

		ok, err := govalidator.ValidateStruct(issueReport)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Detail is required"))
	})

	t.Run(`ReportDate is required`, func(t *testing.T) {
		issueReport := &entity.IssueReport{
			Detail:     "Issue 1",
			ReportDate: time.Time{}, // ผิดตรงนี้
			StatusID:   1,
			TypeID:     1,
			UserID:     1,
		}

		ok, err := govalidator.ValidateStruct(issueReport)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ReportDate is required"))
	})

	t.Run(`StatusID is required`, func(t *testing.T) {
		issueReport := &entity.IssueReport{
			Detail:     "Issue 1",
			ReportDate: time.Now().AddDate(-20, 0, 0),
			StatusID:   0, // ผิดตรงนี้
			TypeID:     1,
			UserID:     1,
		}

		ok, err := govalidator.ValidateStruct(issueReport)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("StatusID is required"))
	})

	t.Run(`TypeID is required`, func(t *testing.T) {
		issueReport := &entity.IssueReport{
			Detail:     "Issue 1",
			ReportDate: time.Now().AddDate(-20, 0, 0),
			StatusID:   1,
			TypeID:     0, // ผิดตรงนี้
			UserID:     1,
		}

		ok, err := govalidator.ValidateStruct(issueReport)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TypeID is required"))
	})

	t.Run(`UserID is required`, func(t *testing.T) {
		issueReport := &entity.IssueReport{
			Detail:     "Issue 1",
			ReportDate: time.Now().AddDate(-20, 0, 0),
			StatusID:   1,
			TypeID:     1,
			UserID:     0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(issueReport)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("UserID is required"))
	})
}
