package entity

<<<<<<< HEAD
=======
import "gorm.io/gorm"

>>>>>>> remotes/origin/Rattasat
type Gender string

const (
	Male   Gender = "Male"
	Female Gender = "Female"
<<<<<<< HEAD
	Other  Gender = "Other"
)
=======
)

type GenderInfo struct {
	gorm.Model
	Type Gender `json:"type"` 
	// `gorm:"column:Gender;type:enum('Male','Female')"`
}
>>>>>>> remotes/origin/Rattasat
