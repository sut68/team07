package mockdata

// import (
// 	"log"
// 	"gorm.io/gorm"
// )

// func seedGenericData(db *gorm.DB, data []interface{}, entityName string) {
//     for _, item := range data {
//         result := db.Create(item) 
//         if result.Error != nil {
//             log.Printf("Failed to seed **%s** data: %v", entityName, result.Error) 
//         }
//     }
// }

// func InsertMock(db *gorm.DB) {
// 	log.Println("Starting database seeding (Refactored)...")

//     var genders, roles,accountStatuses,branch, users, project, teacher, group, student []interface{}

// 	for i := range MockGender { genders = append(genders, &MockGender[i]) }
//     for i := range MockRole { roles = append(roles, &MockRole[i]) }
//     for i := range MockAcountStatus { accountStatuses = append(accountStatuses, &MockAcountStatus[i]) }
//     for i := range MockBranch { branch = append(branch, &MockBranch[i]) }
//     for i := range MockUser { users = append(users, &MockUser[i]) }
//     for i := range MockProject { project = append(project, &MockProject[i]) }
//     for i := range MockTeacher { teacher = append(teacher, &MockTeacher[i]) }
//     for i := range MockGroup { group = append(group, &MockGroup[i]) }
//     for i := range MockStudent { student = append(student, &MockStudent[i]) }
// 	// tx คือ transaction seed พร้อมกันมันเเตก
// 	tx := db.Begin()
//     seedGenericData(tx, genders, "Gender")
//     seedGenericData(tx, roles, "Role")
//     seedGenericData(tx, accountStatuses, "AccountStatus")
//     seedGenericData(tx, branch, "Branch")
//     seedGenericData(tx, users, "User")
//     seedGenericData(tx, project, "Project")
//     seedGenericData(tx, teacher, "Teacher")
//     seedGenericData(tx, group, "Group")
//     seedGenericData(tx, student, "Student")
//     if tx.Error != nil {
//         log.Println("Seeding failed, rolling back...")
//         tx.Rollback()
//         return
//     }
    
//     tx.Commit()
//     log.Println("Database seeding completed.")
