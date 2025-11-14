package entity

import (
	"gorm.io/gorm"
)

type Topic struct {
    gorm.Model
    Title         string `json:"title"`
    Description   string `json:"description"`
	Status 	  string `json:"status"`
    FileAttachment string `json:"file_attachment,omitempty"`
    Proposer_role string `json:"proposer_role"`

	GroupProjectID uint `json:"group_project_id"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`

    TopicSelectionID  []TopicSelection `gorm:"foreignKey:TopicID" json:"topic_selections"`
}

//true