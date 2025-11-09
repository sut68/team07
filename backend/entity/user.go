package entity

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Username string `json:"username"`
	Password string `gorm:"not null" json:"-"`

	StatusID int          `json:"status_id"`
	Status   *AccountStatus `gorm:"foreignKey:StatusID" json:"status"`

	RoleID int          `json:"role_id"`
	Role   *UserRole `gorm:"foreignKey:RoleID" json:"role"`
}