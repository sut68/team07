package entity

import (
	"gorm.io/gorm"
)

type StudentTopic struct {
    gorm.Model
    Title         string `json:"title"`
    Description   string `json:"description"`
    FileAttachment *string `json:"file_attachment,omitempty"`

    GroupID uint   `json:"group_id"`
    Group   *Group  `gorm:"foreignKey:GroupID" json:"group"`
}

