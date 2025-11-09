package entity
<<<<<<< HEAD

import "gorm.io/gorm"

type Gender struct{
	gorm.Model
	Name string `json:"name"`
}
=======
import "gorm.io/gorm"
type Gender string

const (
	Male   Gender = "Male"
	Female Gender = "Female"

)

type GenderInfo struct {
	gorm.Model
	Type Gender `json:"type"` 
	// `gorm:"column:Gender;type:enum('Male','Female')"`
}
>>>>>>> 98902e3764a6bd8322fcd39716a5dc3ec326169e
