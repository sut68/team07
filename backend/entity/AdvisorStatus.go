package entity

// import "gorm.io/gorm"

type AdvisorStatus struct {
	// gorm.Model
	TeacherID uint  `gorm:"primaryKey" json:"teacher_id" valid:"required~TeacherID is required"`
	Teacher   *User `gorm:"foreignKey:TeacherID" json:"teacher"`
	Status    bool  `json:"status" gorm:"default:true"`
}
