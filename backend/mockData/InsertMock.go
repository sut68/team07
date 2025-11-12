package mockdata

import (
	"gorm.io/gorm"
	"log"
)

func seedGenericData(db *gorm.DB, data []interface{}, entityName string, Create bool) {
	for _, item := range data {
		var result *gorm.DB

		if Create {
			result = db.FirstOrCreate(item)
		} else {
			result = db.Create(item)
		}

		if result.Error != nil {
			log.Printf("Failed to seed **%s** data: %v", entityName, result.Error)
		}
	}
}

func InsertMock(db *gorm.DB) {
	log.Println("Starting database seeding (Refactored)...")

	var genders, roles, accountStatuses, branch, IssueStatus, IssueType, actionType []interface{}

	for i := range MockGender {
		genders = append(genders, &MockGender[i])
	}
	for i := range MockRole {
		roles = append(roles, &MockRole[i])
	}
	for i := range MockAcountStatus {
		accountStatuses = append(accountStatuses, &MockAcountStatus[i])
	}
	for i := range MockBranch {
		branch = append(branch, &MockBranch[i])
	}
	for i := range MockIssueStatus {
		IssueStatus = append(IssueStatus, &MockIssueStatus[i])
	}
	for i := range MockIssueType {
		IssueType = append(IssueType, &MockIssueType[i])
	}
	for i := range MockActionType {
		actionType = append(actionType, &MockActionType[i])
	}

	MockData := true
	// คือ true ป้องกันการสร้างข้อมูลซ้ำ
	// คือ false จะสร้างข้อมูลใหม่ทุกครั้งที่รัน

	tx := db.Begin()

	seedGenericData(tx, genders, "Gender", MockData)
	seedGenericData(tx, roles, "Role", MockData)
	seedGenericData(tx, accountStatuses, "AccountStatus", MockData)
	seedGenericData(tx, branch, "Branch", MockData)
	seedGenericData(tx, IssueStatus, "IssueStatus", MockData)
	seedGenericData(tx, IssueType, "IssueType", MockData)
	seedGenericData(tx, actionType, "ActionType", MockData)

	if tx.Error != nil {
		log.Println("Seeding failed, rolling back...")
		tx.Rollback()
		return
	}

	tx.Commit()
	log.Println("Database seeding completed.")
}
