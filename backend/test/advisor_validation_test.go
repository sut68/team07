package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestAdvisor(t *testing.T) {
	g := NewGomegaWithT(t)

	// กรณีที่ 1: ข้อมูลถูกต้องครบถ้วน (True Input)
	t.Run(`True input`, func(t *testing.T) {
		acstatus := &entity.SelectAdvisor{
			No:             1,
			Description:    "Test description",
			Status:         "pending",
			GroupProjectID: 1,
			TeacherID:      1,
		}
		ok, err := govalidator.ValidateStruct(acstatus)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// กรณีที่ 2: เช็ค No ต้องอยู่ระหว่าง 1-20
	t.Run(`Number must be between 1 and 20`, func(t *testing.T) {
		acstatus := &entity.SelectAdvisor{
			No:             21, // ผิดตรงนี้ (เกิน 20)
			Description:    "Test description",
			Status:         "pending",
			GroupProjectID: 1,
			TeacherID:      1,
		}

		ok, err := govalidator.ValidateStruct(acstatus)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Number must be between 1 and 10"))
	})

	// กรณีที่ 3: เช็ค Description ห้ามว่าง
	t.Run(`Description is required`, func(t *testing.T) {
		acstatus := &entity.SelectAdvisor{
			No:             1,
			Description:    "", // ผิดตรงนี้ (ว่าง)
			Status:         "pending",
			GroupProjectID: 1,
			TeacherID:      1,
		}

		ok, err := govalidator.ValidateStruct(acstatus)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Description is required"))
	})

	// กรณีที่ 4: เช็ค Status ห้ามว่าง (เพิ่มใหม่)
	t.Run(`Status is required`, func(t *testing.T) {
		acstatus := &entity.SelectAdvisor{
			No:             1,
			Description:    "Test description",
			Status:         "", // ผิดตรงนี้ (ว่าง)
			GroupProjectID: 1,
			TeacherID:      1,
		}

		ok, err := govalidator.ValidateStruct(acstatus)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Status is required"))
	})

	// กรณีที่ 5: เช็ค GroupProjectID ห้ามเป็น 0
	t.Run(`GroupProjectID is required`, func(t *testing.T) {
		acstatus := &entity.SelectAdvisor{
			No:             1,
			Description:    "Test Description",
			Status:         "pending",
			GroupProjectID: 0, // ผิดตรงนี้ (เป็น 0 หรือไม่ใส่)
			TeacherID:      1,
		}

		ok, err := govalidator.ValidateStruct(acstatus)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GroupProjectID is required"))
	})

	// กรณีที่ 6: เช็ค TeacherID ห้ามเป็น 0
	t.Run(`TeacherID is required`, func(t *testing.T) {
		acstatus := &entity.SelectAdvisor{
			No:             1,
			Description:    "Test Description",
			Status:         "pending",
			GroupProjectID: 1,
			TeacherID:      0, // ผิดตรงนี้ (เป็น 0 หรือไม่ใส่)
		}

		ok, err := govalidator.ValidateStruct(acstatus)

		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TeacherID is required"))
	})
}
