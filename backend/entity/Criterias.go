package entity

import "gorm.io/gorm"

type Criteria struct {
	gorm.Model
	Name      string  `json:"name"`
	MaxScore  float64 `json:"max_score"`
	Order     uint    `json:"order"`

	EvaluationID uint       `json:"evaluation_id"`
	Evaluation   *Evaluation `gorm:"foreignKey:EvaluationID" json:"evaluation"`

	Results          []EvaResult      `gorm:"foreignKey:CriteriaID" json:"results"`
	IndividualScores []IndividualScore `gorm:"foreignKey:CriteriaID" json:"individual_scores"`
}
