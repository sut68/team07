package entity

import "gorm.io/gorm"

type ResetPasswordToken struct {
	gorm.Model
	TokenHash string `gorm:"uniqueIndex;not null"`
	UserID    uint   `gorm:"not null"`
	User      User   `gorm:"foreignKey:UserID"`
	ExpiresAt int64  `gorm:"not null"`
}
