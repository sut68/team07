package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestGroupMem(t *testing.T) {
	g := NewGomegaWithT(t)

	// --- 1. กรณีข้อมูลถูกต้องครบถ้วน (Happy Path) ---
	t.Run(`Valid GroupMember`, func(t *testing.T) {
		groupMember := &entity.GroupMember{
			StudentID:      2,
			GroupProjectID: 1,
			Leader:         false, // boolean ไม่มีการ validate แต่ใส่ไว้ให้ครบ
		}

		ok, err := govalidator.ValidateStruct(groupMember)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// --- 2. กรณี Error Cases ---
	t.Run(`StudentID is required`, func(t *testing.T) {
		groupMember := &entity.GroupMember{
			StudentID:      0, // ผิดตรงนี้ (เป็น 0 หรือไม่ใส่)
			GroupProjectID: 1,
		}

		ok, err := govalidator.ValidateStruct(groupMember)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("StudentID is required"))
	})

	t.Run(`GroupProjectID is required`, func(t *testing.T) {
		groupMember := &entity.GroupMember{
			StudentID:      1,
			GroupProjectID: 0, // ผิดตรงนี้ (เป็น 0 หรือไม่ใส่)
		}

		ok, err := govalidator.ValidateStruct(groupMember)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GroupProjectID is required"))
	})
}