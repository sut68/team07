package entity

import (
	"gorm.io/gorm"
	"time"
)

type TopicSelection struct {
	gorm.Model
	DateSelected time.Time `json:"date_selected"`

	GroupProjectID uint          `json:"group_project_id"`
	GroupProject   *GroupProject `gorm:"foreignKey:GroupProjectID" json:"group_project"`

	TopicID      uint         `json:"topic_id"`
	ProjectTopic *ProjectTopic `gorm:"foreignKey:TopicID" json:"project_topic"`

	STopicID     uint         `json:"s_topic_id"`
	StudentTopic *StudentTopic `gorm:"foreignKey:STopicID" json:"student_topic"`
}
