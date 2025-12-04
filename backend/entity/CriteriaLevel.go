package entity

import "gorm.io/gorm"

type CriteriaLevel struct {
	gorm.Model
	Description string  `json:"description" valid:"required~Description is required"`
	Score       float64 `json:"score" valid:"required,range(0|100)~Score must be between 0 and 100"`

	CriteriaID uint      `json:"criteria_id" valid:"required~CriteriaID is required"`
	Criteria   *Criteria `gorm:"foreignKey:CriteriaID" json:"criteria"`

	EvaResults       []EvaResult       `gorm:"foreignKey:CriteriaLevelID" json:"eva_results"`
	IndividualScores []IndividualScore `gorm:"foreignKey:CriteriaLevelID" json:"individual_scores"`
}
