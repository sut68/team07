package entity

import "gorm.io/gorm"

type RefreshToken struct {
	gorm.Model
	UserID      uint
	User 	  *User `gorm:"foreignKey:UserID"`
	TokenHash string `gorm:"uniqueIndex;not null"`
	ExpiresAt  int64  `gorm:"not null"`
	IsRevoked  bool   `gorm:"not null;default:false"`
}