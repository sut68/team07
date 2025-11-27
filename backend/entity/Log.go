package entity

import (
    "gorm.io/gorm"
)

type Log struct {
    gorm.Model
    UserID       uint       `json:"user_id" valid:"required~UserID is required"`                     
    User         *User      `gorm:"foreignKey:UserID" json:"user"`

    ActionTypeID uint       `json:"action_type_id" valid:"required~ActionTypeID is required"`
    ActionType   *ActionType `gorm:"foreignKey:ActionTypeID" json:"action_type"`                 
}

//true