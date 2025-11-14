package entity

import (
	"gorm.io/gorm"
	"time"
)

type TopicSelection struct {
	gorm.Model
	DateSelected time.Time `json:"date_selected"`

	TopicID uint   `json:"topic_id"`
	Topic   *Topic `gorm:"foreignKey:TopicID" json:"topic"`
	GroupProjectID uint          `json:"group_project_id"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`

	Project  []Project `gorm:"foreignKey:SelectionID" json:"projects"`
	TopicApproval  []TopicApproval `gorm:"foreignKey:SelectionID" json:"topic_approvals"`
}
//true