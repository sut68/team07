package mockdata

import (
	"time"

	"github.com/sut68/team07/backend/entity"
)

var MockRoom = []entity.Room{
	{Name: "B1212", Location: "เรียนรวม1", Capacity: 50},
	{Name: "B1213", Location: "เรียนรวม1", Capacity: 50},
	{Name: "B5201", Location: "เรียนรวม2", Capacity: 120},
	{Name: "B5202", Location: "เรียนรวม2", Capacity: 120},
	{Name: "B6501", Location: "Digitech", Capacity: 400},
	{Name: "B6503", Location: "Digitech", Capacity: 200},
}

var MockAppointmentType = []entity.AppointmentType{
	{Name: "Topic Defense"},
	{Name: "Progress Report"},
	{Name: "Final Defense"},
}

var MockAppointment = []entity.Appointment{
	{
		StartDateTime: time.Date(2025, 12, 20, 9, 0, 0, 0, time.Local),
		DurationMin: 30, AppointmentStatus: "completed", AppointmentTypeID: 3, RoomID: 1, TeacherID: 2, GroupProjectID: 3,
	},
	{
		StartDateTime: time.Date(2025, 12, 25, 13, 30, 0, 0, time.Local),
		DurationMin: 30, AppointmentStatus: "scheduled", AppointmentTypeID: 2, RoomID: 3, TeacherID: 3, GroupProjectID: 1,
	},
	{
		StartDateTime: time.Date(2026, 1, 10, 10, 0, 0, 0, time.Local),
		DurationMin: 30, AppointmentStatus: "scheduled", AppointmentTypeID: 3, RoomID: 5, TeacherID: 4, GroupProjectID: 2,
	},
}

var MockEvaluation = []entity.Evaluation{
	{Name: "Ethics Test", TotalScore: 5, ForGroupOnly: false, AppointmentTypeID: 3},
	{Name: "Peer Assessment", TotalScore: 5, ForGroupOnly: false, AppointmentTypeID: 3},
	{Name: "Advisor Evaluation", TotalScore: 55, ForGroupOnly: true, AppointmentTypeID: 3},
	{Name: "Committee Evaluation", TotalScore: 35, ForGroupOnly: true, AppointmentTypeID: 3},
}

var MockCriteria = []entity.Criteria{

	// 1. Ethics Test (5%) - รายบุคคล
	{
		Name:         "Ethics Exam Score (คะแนนสอบจริยธรรม)",
		MaxScore:     5,
		Order:        1,
		EvaluationID: 1,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Excellent (ดีเยี่ยม)", Score: 5},
			{Description: "Good (ดี)", Score: 4},
			{Description: "Fair (พอใช้)", Score: 3},
			{Description: "Poor (ปรับปรุง)", Score: 1},
		},
	},

	// 2. Peer Assessment (5%) - รายบุคคล
	{
		Name:         "Collaboration & Attendance (ความร่วมมือ)",
		MaxScore:     5,
		Order:        1,
		EvaluationID: 2,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Always (สม่ำเสมอ)", Score: 5},
			{Description: "Often (บ่อยครั้ง)", Score: 4},
			{Description: "Sometimes (บางครั้ง)", Score: 3},
			{Description: "Rarely (แทบไม่เคย)", Score: 1},
		},
	},
	// 3. Advisor Evaluation (55%) - รายกลุ่ม
	{
		Name:         "System Completeness (ความสมบูรณ์ระบบ)",
		MaxScore:     20,
		Order:        1,
		EvaluationID: 3,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Complete (สมบูรณ์ 100%)", Score: 20},
			{Description: "Almost Complete (เกือบสมบูรณ์ 80%)", Score: 15},
			{Description: "Partial (เสร็จบางส่วน 50%)", Score: 10},
			{Description: "Incomplete (ไม่เสร็จ <50%)", Score: 5},
		},
	},
	{
		Name:         "Documentation (รูปเล่ม)",
		MaxScore:     15,
		Order:        2,
		EvaluationID: 3,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Excellent (ดีมาก)", Score: 15},
			{Description: "Good (ดี)", Score: 10},
			{Description: "Fair (พอใช้)", Score: 5},
		},
	},
	{
		Name:         "Effort & Process (ความตั้งใจ)",
		MaxScore:     10,
		Order:        3,
		EvaluationID: 3,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "High Effort (ตั้งใจมาก)", Score: 10},
			{Description: "Moderate (ปานกลาง)", Score: 7},
			{Description: "Low (น้อย)", Score: 4},
		},
	},
	{
		Name:         "Technique & Complexity (ความซับซ้อน)",
		MaxScore:     10,
		Order:        4,
		EvaluationID: 3,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Advanced (ซับซ้อนสูง)", Score: 10},
			{Description: "Standard (มาตรฐาน)", Score: 7},
			{Description: "Basic (พื้นฐาน)", Score: 4},
		},
	},
	// 4. Committee Evaluation (35%) - รายกลุ่ม (สอบ Final)
	{
		Name:         "Presentation Skills (การนำเสนอ)",
		MaxScore:     10,
		Order:        1,
		EvaluationID: 4,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Professional (มืออาชีพ)", Score: 10},
			{Description: "Good (ดี)", Score: 8},
			{Description: "Fair (พอใช้)", Score: 5},
		},
	},
	{
		Name:         "Q&A (การตอบคำถาม)",
		MaxScore:     10,
		Order:        2,
		EvaluationID: 4,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Clear & Correct (ชัดเจนและถูกต้อง)", Score: 10},
			{Description: "Partially Correct (ถูกบางส่วน)", Score: 6},
			{Description: "Unclear (ตอบไม่ได้/ไม่ชัดเจน)", Score: 2},
		},
	},
	{
		Name:         "System Demo (การสาธิตระบบ)",
		MaxScore:     15,
		Order:        3,
		EvaluationID: 4,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Smooth (ราบรื่น)", Score: 15},
			{Description: "Minor Issues (ติดขัดเล็กน้อย)", Score: 10},
			{Description: "Failed/Error (ล้มเหลว)", Score: 5},
		},
	},
}
