package entity

import (
	"gorm.io/gorm"
)

type Topic struct {
    gorm.Model
    Title         string `json:"title" form:"title" valid:"required~Title is required"`
    Objective     string `json:"objective" form:"objective" valid:"required~Objective is required"`
    Scope         string `json:"scope" form:"scope" valid:"required~Scope is required"`
    Description   string `json:"description" form:"description" valid:"required~Description is required"`
	Status 	  string `json:"status" form:"status" valid:"required~Status is required"`
    FileAttachment string `json:"file_attachment,omitempty" form:"file_attachment"`
    ProposerRole string `json:"proposer_role" form:"proposer_role"`

	GroupProjectID *uint `json:"group_project_id" form:"group_project_id"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`
	
	TeacherID *uint `json:"teacher_id" form:"teacher_id"`
	Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`
	
    TopicApproval []TopicApproval `gorm:"foreignKey:TopicID" json:"topic_approvals"`

}
