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
	var users ,rooms ,groupPro, groupMem ,appointType, appointment ,evaluation,criteria[]interface{}
	var topicSelection ,project,topic[]interface{}
	for i := range MockGender { genders = append(genders, &MockGender[i])}
	for i := range MockRole {roles = append(roles, &MockRole[i])}
	for i := range MockAcountStatus {accountStatuses = append(accountStatuses, &MockAcountStatus[i])}
	for i := range MockBranch {branch = append(branch, &MockBranch[i])}
	for i := range MockIssueStatus {IssueStatus = append(IssueStatus, &MockIssueStatus[i])}
	for i := range MockIssueType {IssueType = append(IssueType, &MockIssueType[i])}
	for i := range MockActionType {actionType = append(actionType, &MockActionType[i])}
	for i := range MockUser {users = append(users, &MockUser[i])}
	for i := range MockGroupProject {groupPro = append(groupPro, &MockGroupProject[i])}
	for i := range MockGroupMember {groupMem = append(groupMem, &MockGroupMember[i])}
	for i := range MockRoom {rooms = append(rooms, &MockRoom[i])}
	for i := range MockAppointmentType {appointType = append(appointType, &MockAppointmentType[i])}
	for i := range MockAppointment {appointment = append(appointment, &MockAppointment[i])}
	for i := range MockEvaluation {evaluation = append(evaluation, &MockEvaluation[i])}
	for i := range MockCriteria {criteria = append(criteria, &MockCriteria[i])}
	for i := range MockTopics {topic = append(topic, &MockTopics[i])}
	for i := range MockTopicSelections {topicSelection = append(topicSelection, &MockTopicSelections[i])}
	for i := range MockProjects {project = append(project, &MockProjects[i])}

	MockDataCreate := true
	// คือ true ป้องกันการสร้างข้อมูลซ้ำ
	// คือ false จะสร้างข้อมูลใหม่ทุกครั้งที่รัน

	tx := db.Begin()

	seedGenericData(tx, genders, "Gender", MockDataCreate)
	seedGenericData(tx, roles, "Role", MockDataCreate)
	seedGenericData(tx, accountStatuses, "AccountStatus", MockDataCreate)
	seedGenericData(tx, branch, "Branch", MockDataCreate)
	seedGenericData(tx, IssueStatus, "IssueStatus", MockDataCreate)
	seedGenericData(tx, IssueType, "IssueType", MockDataCreate)
	seedGenericData(tx, actionType, "ActionType", MockDataCreate)
	seedGenericData(tx, users, "User", MockDataCreate)
	seedGenericData(tx, groupPro, "GroupProject", MockDataCreate)
	seedGenericData(tx, groupMem, "GroupMember", MockDataCreate)
	seedGenericData(tx, rooms, "Room", MockDataCreate)
	seedGenericData(tx, appointType, "AppointmentType", MockDataCreate)
	seedGenericData(tx, appointment, "Appointment", MockDataCreate)
	seedGenericData(tx, evaluation, "Evaluation", MockDataCreate)
	seedGenericData(tx, criteria, "Criteria", MockDataCreate)
	seedGenericData(tx, topic, "Topic", MockDataCreate)
	seedGenericData(tx, topicSelection, "TopicSelection", MockDataCreate)
	seedGenericData(tx, project, "Project", MockDataCreate)

	if tx.Error != nil {
		log.Println("Seeding failed, rolling back...")
		tx.Rollback()
		return
	}

	tx.Commit()
	log.Println("Database seeding completed.")
}
