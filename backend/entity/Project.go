package entity

import (
	"gorm.io/gorm"
	"time"
)

type Project struct {
	gorm.Model
	Title         string    `gorm:"column:Title"`
	Abstract      string    `gorm:"column:Abstract"`
	Keywords      string    `gorm:"column:Keywords"`
	Year          int       `gorm:"column:Year"`
	Status        string    `gorm:"column:Status"`
	FilePath      string    `gorm:"column:FilePath"`
	CreatedDate   time.Time `gorm:"column:CreatedDate"`
	UpdatedDate   time.Time `gorm:"column:UpdatedDate"`
	

	BranchID      int       `gorm:"column:branch_id"`
	Branch        *Branch    `gorm:"foreignKey:BranchID"`


	Group         []Group     `gorm:"foreignKey:ProjectID"`
 
	

}