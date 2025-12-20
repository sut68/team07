package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team07/backend/entity"
)

func TestUser(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Case 1: User Data is all correct`, func(t *testing.T) {
		users := &entity.User{
			Username:  "b6640205@sut.ac.th",
			Password:  "R@123456",
			Firstname: "Rattsat",
			Lastname:  "Sangthong",
			Email:     "a@gmail.com",
			Phone:     "0912345678",
			GenderID:  1,
			BranchID:  1,
			RoleID:    1,
			StatusID:  1,
		}
		ok, err := govalidator.ValidateStruct(users)
		g.Expect(ok).To(BeTrue()) // คาดหวังว่าเป็น True
		g.Expect(err).To(BeNil()) // คาดหวังว่าไม่มี Error
	})

	t.Run(`Username is required`, func(t *testing.T) {
		users := &entity.User{
			Username:  "", // ผิดตรงนี้
			Password:  "R@123456",
			Firstname: "Rattsat",
			Lastname:  "Sangthong",
			Email:     "a@gmail.com",
			Phone:     "0912345678",

			GenderID: 1,
			BranchID: 1,
			RoleID:   1,
			StatusID: 1,
		}

		ok, err := govalidator.ValidateStruct(users)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Username is required"))
	})

	t.Run(`Password is required`, func(t *testing.T) {
		users := &entity.User{
			Username:  "b6640205@sut.ac.th",
			Password:  "", // ผิดตรงนี้
			Firstname: "Rattsat",
			Lastname:  "Sangthong",
			Email:     "a@gmail.com",
			Phone:     "0912345678",

			GenderID: 1,
			BranchID: 1,
			RoleID:   1,
			StatusID: 1,
		}

		ok, err := govalidator.ValidateStruct(users)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Password is required"))
	})

	t.Run(`Firstname is required`, func(t *testing.T) {
		users := &entity.User{
			Username:  "b6640205@sut.ac.th",
			Password:  "R@123456",
			Firstname: "", // ผิดตรงนี้
			Lastname:  "Sangthong",
			Email:     "a@gmail.com",
			Phone:     "0912345678",

			GenderID: 1,
			BranchID: 1,
			RoleID:   1,
			StatusID: 1,
		}

		ok, err := govalidator.ValidateStruct(users)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Firstname is required"))
	})

	t.Run(`Lastname is required`, func(t *testing.T) {
		users := &entity.User{
			Username:  "b6640205@sut.ac.th",
			Password:  "R@123456",
			Firstname: "Rattsat",
			Lastname:  "", // ผิดตรงนี้
			Email:     "a@gmail.com",
			Phone:     "0912345678",

			GenderID: 1,
			BranchID: 1,
			RoleID:   1,
			StatusID: 1,
		}

		ok, err := govalidator.ValidateStruct(users)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Lastname is required"))
	})

	t.Run(`Email and Phone can be empty`, func(t *testing.T) {
		users := &entity.User{
			Username:  "b6640205@sut.ac.th",
			Password:  "R@123456",
			Firstname: "Rattsat",
			Lastname:  "Sangthong",
			Email:     "", // ว่างได้ ไม่ error
			Phone:     "", // ว่างได้ ไม่ error

			GenderID: 1,
			BranchID: 1,
			RoleID:   1,
			StatusID: 1,
		}

		ok, err := govalidator.ValidateStruct(users)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run(`GenderID is required`, func(t *testing.T) {
		users := &entity.User{
			Username:  "b6640205@sut.ac.th",
			Password:  "R@123456",
			Firstname: "Rattsat",
			Lastname:  "Thong",
			Email:     "a@gmail.com",
			Phone:     "0912345678",

			GenderID: 0, // ผิดตรงนี้
			BranchID: 1,
			RoleID:   1,
			StatusID: 1,
		}

		ok, err := govalidator.ValidateStruct(users)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("GenderID is required"))
	})

	t.Run(`BranchID is required`, func(t *testing.T) {
		users := &entity.User{
			Username:  "b6640205@sut.ac.th",
			Password:  "R@123456",
			Firstname: "Rattsat",
			Lastname:  "Thong",
			Email:     "a@gmail.com",
			Phone:     "0912345678",

			GenderID: 1,
			BranchID: 0, // ผิดตรงนี้
			RoleID:   1,
			StatusID: 1,
		}

		ok, err := govalidator.ValidateStruct(users)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("BranchID is required"))
	})

	t.Run(`RoleID is required`, func(t *testing.T) {
		users := &entity.User{
			Username:  "b6640205@sut.ac.th",
			Password:  "R@123456",
			Firstname: "Rattsat",
			Lastname:  "Thong",
			Email:     "a@gmail.com",
			Phone:     "0912345678",

			GenderID: 1,
			BranchID: 1,
			RoleID:   0, // ผิดตรงนี้
			StatusID: 1,
		}

		ok, err := govalidator.ValidateStruct(users)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("RoleID is required"))
	})

	t.Run(`StatusID is required`, func(t *testing.T) {
		users := &entity.User{
			Username:  "b6640205@sut.ac.th",
			Password:  "R@123456",
			Firstname: "Rattsat",
			Lastname:  "Thong",
			Email:     "a@gmail.com",
			Phone:     "0912345678",

			GenderID: 1,
			BranchID: 1,
			RoleID:   1,
			StatusID: 0, // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(users)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("StatusID is required"))
	})

}
