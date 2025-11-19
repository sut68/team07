package entity

import (
    "gorm.io/gorm"
)

type Log struct {
    gorm.Model
    UserID       uint       `json:"user_id"`                     
    User         *User      `gorm:"foreignKey:UserID" json:"user"`

    ActionTypeID uint       `json:"action_type_id"`             
    ActionType   *ActionType `gorm:"foreignKey:ActionTypeID" json:"action_type"`                 
}

//true