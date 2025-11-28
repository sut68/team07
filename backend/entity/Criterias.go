package entity

import "gorm.io/gorm"

type Criteria struct {
	gorm.Model
	Name      string  `json:"name" valid:"required~Name is required"`
	MaxScore  float64 `json:"max_score" valid:"required,range(0|100)~MaxScore is required and must be between 0 to 100"`
	Order     uint    `json:"order" valid:"required~Order is required"`

	EvaluationID uint       `json:"evaluation_id" valid:"required~EvaluationID is required"`
	Evaluation   *Evaluation `gorm:"foreignKey:EvaluationID" json:"evaluation"`

	Results          []EvaResult      `gorm:"foreignKey:CriteriaID" json:"results"`
	IndividualScores []IndividualScore `gorm:"foreignKey:CriteriaID" json:"individual_scores"`
}