package mockdata

import (
	"log"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func seed(db *gorm.DB, data interface{}) {
	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(data).Error; err != nil {
		log.Printf("Seeding error: %v", err)
	}
}

func InsertMock(db *gorm.DB) {
	log.Println("Starting database seeding...")

	tx := db.Begin()

	seed(tx, &MockGender)
	seed(tx, &MockRole)
	seed(tx, &MockAccountStatus)
	seed(tx, &MockBranch)
	seed(tx, &MockIssueStatus)
	seed(tx, &MockIssueType)
	seed(tx, &MockActionType)

	seed(tx, &MockUser)

	seed(tx, &MockGroupProject)
	seed(tx, &MockGroupMember)

	seed(tx, &MockRoom)
	seed(tx, &MockTopics)
	seed(tx, &MockTopicSelections)
	seed(tx, &MockProjects)

	seed(tx, &MockAppointmentType)
	// seed(tx, &MockAppointment)
	seed(tx, &MockEvaluation)
	seed(tx, &MockCriteria)

	if tx.Error != nil {
		log.Println("Seeding failed, rolling back...")
		tx.Rollback()
		return
	}

	tx.Commit()
	log.Println("Database seeding completed successfully.")
}
