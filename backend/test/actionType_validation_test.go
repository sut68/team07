package test

import (
	"testing"

	"github.com/asaskevich/govalidator"
	"github.com/sut68/team07/backend/entity"
	. "github.com/onsi/gomega"
)

func TestActionType(t *testing.T) {
	g := NewGomegaWithT(t)
	t.Run(`True input`, func(t *testing.T) {
		acstatus := &entity.ActionType{
			ActionType: "SomeActionType", 
		}

		ok, err := govalidator.ValidateStruct(acstatus)
		
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
	
	t.Run(`ActionType is required`, func(t *testing.T) {
		acstatus := &entity.ActionType{
			ActionType: "", // ผิดตรงนี้
		}

		ok, err := govalidator.ValidateStruct(acstatus)
		
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("ActionType is required"))
	})
}