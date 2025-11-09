package mockdata

import (
	"log"
	"gorm.io/gorm"
)

func seedGenericData(db *gorm.DB, data []interface{}, entityName string) {
	for _, item := range data {
		result := db.FirstOrCreate(item)
		if result.Error != nil {
			log.Printf("Failed to seed **%s** data: %v", entityName, result.Error)
		}
	}
}

func InsertMock(db *gorm.DB) {
	log.Println("Starting database seeding (Refactored)...")

	var genders []interface{}
	for i := range MockGender {
		genders = append(genders, &MockGender[i])
	}
	seedGenericData(db, genders, "Gender")

	var roles []interface{}
	for i := range MockRole {
		roles = append(roles, &MockRole[i])
	}
	seedGenericData(db, roles, "Role")

	var accountStatuses []interface{}
	for i := range MockAcountStatus {
		accountStatuses = append(accountStatuses, &MockAcountStatus[i])
	}
	seedGenericData(db, accountStatuses, "AccountStatus")
	
	var users []interface{}
	for i := range MockUser {
		users = append(users, &MockUser[i])
	}
	seedGenericData(db, users, "User")

	var teacher []interface{}
	for i := range MockTeacher {
		teacher = append(teacher, &MockTeacher[i])
	}
	seedGenericData(db, teacher, "Teacher")

	var group []interface{}
	for i := range MockGroup {
		group = append(group, &MockGroup[i])
	}
	seedGenericData(db, group, "Group")

	var student []interface{}
	for i := range MockStudent {
		student = append(student, &MockStudent[i])
	}
	seedGenericData(db, student, "Student")

	log.Println("Database seeding completed.")
}