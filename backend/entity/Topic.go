package entity

import (
	"gorm.io/gorm"
)

type Topic struct {
    gorm.Model
    Title         string `json:"title" valid:"required~Title is required"`
    Objective     string `json:"objective" valid:"required~Objective is required"`
    Scope         string `json:"scope" valid:"required~Scope is required"`
    Description   string `json:"description" valid:"required~Description is required"`
	Status 	  string `json:"status" valid:"required~Status is required"`
    FileAttachment string `json:"file_attachment,omitempty"`
    Proposer_role string `json:"proposer_role" valid:"required~ProposerRole is required"`

	GroupProjectID *uint `json:"group_project_id"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`

    TopicApproval []TopicApproval `gorm:"foreignKey:TopicID" json:"topic_approvals"`

}
