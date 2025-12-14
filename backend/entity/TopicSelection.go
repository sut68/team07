package entity

import (
	"gorm.io/gorm"
	"time"
)

type TopicSelection struct {
	gorm.Model
	DateSelected time.Time `json:"date_selected" valid:"required~DateSelected is required"`

	TopicID uint   `json:"topic_id" valid:"required~TopicID is required"`
	Topic   *Topic `gorm:"foreignKey:TopicID" json:"topic"`
	GroupProjectID uint          `json:"group_project_id" valid:"required~GroupProjectID is required"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`

	Project  []Project `gorm:"foreignKey:SelectionID" json:"projects"`

}
 