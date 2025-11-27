package entity

import "gorm.io/gorm"

type ActionType struct {
    gorm.Model
    ActionType string `json:"action_type" valid:"required~ActionType is required"`
    Logs       []Log `gorm:"foreignKey:ActionTypeID" json:"logs"`
}

//true
