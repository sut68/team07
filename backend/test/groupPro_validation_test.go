package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestGroupPro(t *testing.T) {
	g := NewGomegaWithT(t)

	// --- 1. กรณีข้อมูลถูกต้องครบถ้วน (Happy Path) ---
	t.Run(`Valid GroupProject`, func(t *testing.T) {
		id := uint(1) // สร้างตัวแปรเพื่อทำ Pointer
		groupProject := &entity.GroupProject{
			GroupNumber: 1,
			GroupStatus: "Pending",
			Membership:  3,
			TeacherID:   &id, // ใส่ค่าอาจารย์ (pointer)
		}

		ok, err := govalidator.ValidateStruct(groupProject)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// --- 2. กรณี TeacherID เป็นค่าว่าง (NULL) ต้องผ่าน (ตาม Logic ใหม่) ---
	t.Run(`TeacherID can be null`, func(t *testing.T) {
		groupProject := &entity.GroupProject{
			GroupNumber: 1,
			GroupStatus: "Pending",
			Membership:  3,
			TeacherID:   nil, // เป็นค่าว่าง
		}

		ok, err := govalidator.ValidateStruct(groupProject)

		// ต้องผ่าน (True) เพราะเราเอา valid:"required" ออกแล้ว
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// --- 3. กรณี GroupNumber ผิดเงื่อนไข (Error Cases) ---
	t.Run(`GroupNumber must be between 1 and 40`, func(t *testing.T) {
		groupProject := &entity.GroupProject{
			GroupNumber: 50, // ผิดตรงนี้ (>40)
			GroupStatus: "In Process",
			Membership:  5,
			TeacherID:   nil,
		}

		ok, err := govalidator.ValidateStruct(groupProject)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GroupNumber must be between 1 and 40"))
	})

	t.Run(`GroupStatus is required`, func(t *testing.T) {
		groupProject := &entity.GroupProject{
			GroupNumber: 10,
			GroupStatus: "", // ผิดตรงนี้ (ว่าง)
			Membership:  5,
			TeacherID:   nil,
		}

		ok, err := govalidator.ValidateStruct(groupProject)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GroupStatus is required"))
	})

	t.Run(`Membership must be between 3 and 5`, func(t *testing.T) {
		groupProject := &entity.GroupProject{
			GroupNumber: 25,
			GroupStatus: "In Process",
			Membership:  10, // ผิดตรงนี้ (>5)
			TeacherID:   nil,
		}

		ok, err := govalidator.ValidateStruct(groupProject)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Membership must be between 3 and 5"))
	})
}