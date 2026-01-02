package mockdata

import (
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

var MockEvaluation = []entity.Evaluation{
	{Name: "Ethics Test", TotalScore: 5, ForGroupOnly: false, AppointmentTypeID: 3},
	{Name: "Peer Assessment", TotalScore: 5, ForGroupOnly: false, AppointmentTypeID: 3},
	{Name: "Advisor Evaluation", TotalScore: 55, ForGroupOnly: true, AppointmentTypeID: 3},
	{Name: "Committee Evaluation", TotalScore: 35, ForGroupOnly: false, AppointmentTypeID: 3},
}

var MockCriteria = []entity.Criteria{

	// ---------------------------------------------------
	// 1. Ethics Test (5%) - รายบุคคล (5 ข้อ x 1 คะแนน)
	// ---------------------------------------------------
	{
		Name:         "Honesty & Integrity (ความซื่อสัตย์)",
		MaxScore:     1,
		Order:        1,
		EvaluationID: 1,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Excellent (ดีเยี่ยม)", Score: 1.0},
			{Description: "Good (ดี)", Score: 0.8},
			{Description: "Moderate (ปานกลาง)", Score: 0.6},
			{Description: "Fair (พอใช้)", Score: 0.4},
			{Description: "Poor (ปรับปรุง)", Score: 0.2},
		},
	},
	{
		Name:         "Responsibility (ความรับผิดชอบ)",
		MaxScore:     1,
		Order:        2,
		EvaluationID: 1,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Excellent (ดีเยี่ยม)", Score: 1.0},
			{Description: "Good (ดี)", Score: 0.8},
			{Description: "Moderate (ปานกลาง)", Score: 0.6},
			{Description: "Fair (พอใช้)", Score: 0.4},
			{Description: "Poor (ปรับปรุง)", Score: 0.2},
		},
	},
	{
		Name:         "Discipline & Punctuality (วินัยและการตรงต่อเวลา)",
		MaxScore:     1,
		Order:        3,
		EvaluationID: 1,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Always Punctual (ตรงเวลาเสมอ)", Score: 1.0},
			{Description: "Mostly Punctual (ตรงเวลาส่วนใหญ่)", Score: 0.8},
			{Description: "Sometimes Late (สายบางครั้ง)", Score: 0.6},
			{Description: "Often Late (สายบ่อย)", Score: 0.4},
			{Description: "Very Late (สายมาก)", Score: 0.2},
		},
	},
	{
		Name:         "Respect for Others (การให้เกียรติผู้อื่น)",
		MaxScore:     1,
		Order:        4,
		EvaluationID: 1,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Excellent (ดีเยี่ยม)", Score: 1.0},
			{Description: "Good (ดี)", Score: 0.8},
			{Description: "Moderate (ปานกลาง)", Score: 0.6},
			{Description: "Fair (พอใช้)", Score: 0.4},
			{Description: "Poor (ปรับปรุง)", Score: 0.2},
		},
	},
	{
		Name:         "Compliance with Rules (การปฏิบัติตามกฎระเบียบ)",
		MaxScore:     1,
		Order:        5,
		EvaluationID: 1,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Fully Compliant (ปฏิบัติตามครบถ้วน)", Score: 1.0},
			{Description: "Mostly Compliant (ปฏิบัติตามส่วนใหญ่)", Score: 0.8},
			{Description: "Partially Compliant (ปฏิบัติตามบางส่วน)", Score: 0.6},
			{Description: "Minor Violations (ละเมิดเล็กน้อย)", Score: 0.4},
			{Description: "Major Violations (ละเมิดร้ายแรง)", Score: 0.2},
		},
	},

	// ---------------------------------------------------
	// 2. Peer Assessment (5%) - รายบุคคล (5 ข้อ x 1 คะแนน)
	// ---------------------------------------------------
	{
		Name:         "Collaboration (ความร่วมมือ)",
		MaxScore:     1,
		Order:        1,
		EvaluationID: 2,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Always (สม่ำเสมอ)", Score: 1.0},
			{Description: "Often (บ่อยครั้ง)", Score: 0.8},
			{Description: "Sometimes (บางครั้ง)", Score: 0.6},
			{Description: "Rarely (แทบไม่เคย)", Score: 0.4},
			{Description: "Never (ไม่เคย)", Score: 0.0},
		},
	},
	{
		Name:         "Communication (การสื่อสาร)",
		MaxScore:     1,
		Order:        2,
		EvaluationID: 2,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Excellent (ดีเยี่ยม)", Score: 1.0},
			{Description: "Good (ดี)", Score: 0.8},
			{Description: "Fair (พอใช้)", Score: 0.5},
			{Description: "Poor (แย่)", Score: 0.0},
		},
	},
	{
		Name:         "Problem Solving (การแก้ปัญหา)",
		MaxScore:     1,
		Order:        3,
		EvaluationID: 2,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Proactive (กระตือรือร้น)", Score: 1.0},
			{Description: "Active (มีส่วนร่วม)", Score: 0.8},
			{Description: "Passive (เฉยเมย)", Score: 0.4},
			{Description: "None (ไม่ทำอะไรเลย)", Score: 0.0},
		},
	},
	{
		Name:         "Quality of Work (คุณภาพงาน)",
		MaxScore:     1,
		Order:        4,
		EvaluationID: 2,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "High Quality (คุณภาพสูง)", Score: 1.0},
			{Description: "Standard (มาตรฐาน)", Score: 0.8},
			{Description: "Low Quality (ต่ำกว่ามาตรฐาน)", Score: 0.4},
			{Description: "Unusable (ใช้งานไม่ได้)", Score: 0.0},
		},
	},
	{
		Name:         "Attendance (การเข้าร่วมประชุม)",
		MaxScore:     1,
		Order:        5,
		EvaluationID: 2,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Always (สม่ำเสมอ)", Score: 1.0},
			{Description: "Often (บ่อยครั้ง)", Score: 0.8},
			{Description: "Sometimes (บางครั้ง)", Score: 0.6},
			{Description: "Rarely (แทบไม่เคย)", Score: 0.4},
			{Description: "Never (ไม่เคย)", Score: 0.0},
		},
	},

	// ---------------------------------------------------
	// 3. Advisor Evaluation (55%) - รายกลุ่ม
	// ---------------------------------------------------
	// 3.1 System Completeness (20) -> Split into Core (10) + Features (10)
	{
		Name:         "Core Functionality (ฟังก์ชันหลัก)",
		MaxScore:     10,
		Order:        1,
		EvaluationID: 3,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Complete & Bug-free (สมบูรณ์)", Score: 10},
			{Description: "Minor Bugs (มีบั๊กเล็กน้อย)", Score: 8},
			{Description: "Major Bugs (มีบั๊กร้ายแรง)", Score: 5},
			{Description: "Incomplete (ไม่เสร็จ)", Score: 2},
		},
	},
	{
		Name:         "Feature Completeness (ความครบถ้วนของฟีเจอร์)",
		MaxScore:     10,
		Order:        2,
		EvaluationID: 3,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "All Features Done (ครบทุกฟีเจอร์)", Score: 10},
			{Description: "Most Features Done (เกือบครบ)", Score: 8},
			{Description: "Half Done (เสร็จครึ่งหนึ่ง)", Score: 5},
			{Description: "Few Features (เสร็จน้อยมาก)", Score: 2},
		},
	},
	// 3.2 Documentation (15) -> Report (8) + Format (7)
	{
		Name:         "Report Quality (คุณภาพเนื้อหารายงาน)",
		MaxScore:     8,
		Order:        3,
		EvaluationID: 3,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Excellent (ดีเยี่ยม)", Score: 8},
			{Description: "Good (ดี)", Score: 6},
			{Description: "Fair (พอใช้)", Score: 4},
			{Description: "Poor (ปรับปรุง)", Score: 2},
		},
	},
	{
		Name:         "Formatting & Standards (รูปแบบและมาตรฐาน)",
		MaxScore:     7,
		Order:        4,
		EvaluationID: 3,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Perfect (ถูกต้องสมบูรณ์)", Score: 7},
			{Description: "Minor Errors (ผิดเล็กน้อย)", Score: 5},
			{Description: "Major Errors (ผิดเยอะ)", Score: 3},
			{Description: "Wrong Format (ผิดรูปแบบ)", Score: 1},
		},
	},
	// 3.3 Effort (10) -> Consistency (5) + Dedication (5)
	{
		Name:         "Consistency (ความสม่ำเสมอ)",
		MaxScore:     5,
		Order:        5,
		EvaluationID: 3,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Very Consistent (สม่ำเสมอมาก)", Score: 5},
			{Description: "Consistent (สม่ำเสมอ)", Score: 4},
			{Description: "Inconsistent (ไม่สม่ำเสมอ)", Score: 2},
		},
	},
	{
		Name:         "Dedication & Problem Solving (ความทุ่มเท)",
		MaxScore:     5,
		Order:        6,
		EvaluationID: 3,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "High Dedication (ทุ่มเทมาก)", Score: 5},
			{Description: "Moderate (ปานกลาง)", Score: 3},
			{Description: "Low (น้อย)", Score: 1},
		},
	},
	// 3.4 Technique (10) -> Complexity (5) + Implementation (5)
	{
		Name:         "Technical Complexity (ความซับซ้อนทางเทคนิค)",
		MaxScore:     5,
		Order:        7,
		EvaluationID: 3,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Advanced (ซับซ้อนสูง)", Score: 5},
			{Description: "Standard (มาตรฐาน)", Score: 3},
			{Description: "Basic (พื้นฐาน)", Score: 1},
		},
	},
	{
		Name:         "Implementation Quality (คุณภาพการเขียนโค้ด)",
		MaxScore:     5,
		Order:        8,
		EvaluationID: 3,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Clean & Efficient (สะอาดและมีประสิทธิภาพ)", Score: 5},
			{Description: "Standard (มาตรฐาน)", Score: 3},
			{Description: "Messy (ยุ่งเหยิง)", Score: 1},
		},
	},

	// ---------------------------------------------------
	// 4. Committee Evaluation (35%) - รายกลุ่ม (สอบ Final)
	// ---------------------------------------------------
	// 4.1 Presentation (10) -> Slides (5) + Speaking (5)
	{
		Name:         "Presentation Materials (สื่อการนำเสนอ)",
		MaxScore:     5,
		Order:        1,
		EvaluationID: 4,
		IsGroup:      true,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Professional (มืออาชีพ)", Score: 5},
			{Description: "Good (ดี)", Score: 4},
			{Description: "Fair (พอใช้)", Score: 2},
		},
	},
	{
		Name:         "Speaking & Timing (การพูดและรักษาเวลา)",
		MaxScore:     5,
		Order:        2,
		EvaluationID: 4,
		IsGroup:      true,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Clear & On Time (ชัดเจน/ตรงเวลา)", Score: 5},
			{Description: "Good (ดี)", Score: 4},
			{Description: "Unclear/Overtime (ไม่ชัดเจน/เกินเวลา)", Score: 2},
		},
	},
	// 4.2 Q&A (10) -> Accuracy (5) + Confidence (5)
	{
		Name:         "Answer Accuracy (ความถูกต้องของคำตอบ)",
		MaxScore:     5,
		Order:        3,
		EvaluationID: 4,
		IsGroup:      true,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Correct & Precise (ถูกต้องแม่นยำ)", Score: 5},
			{Description: "Mostly Correct (ถูกส่วนใหญ่)", Score: 4},
			{Description: "Incorrect (ผิด)", Score: 1},
		},
	},
	{
		Name:         "Confidence & Clarity (ความมั่นใจ)",
		MaxScore:     5,
		Order:        4,
		EvaluationID: 4,
		IsGroup:      true,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Confident (มั่นใจ)", Score: 5},
			{Description: "Moderate (ปานกลาง)", Score: 3},
			{Description: "Unsure (ไม่มั่นใจ)", Score: 1},
		},
	},
	// 4.3 Demo (10) -> Flow (5) + Error Handling (5)
	{
		Name:         "Demo Flow (ลำดับการสาธิต)",
		MaxScore:     5,
		Order:        5,
		EvaluationID: 4,
		IsGroup:      true,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Smooth (ราบรื่น)", Score: 5},
			{Description: "Minor Hiccups (ติดขัดเล็กน้อย)", Score: 3},
			{Description: "Confusing (สับสน)", Score: 1},
		},
	},
	{
		Name:         "Error Handling during Demo (การจัดการข้อผิดพลาด)",
		MaxScore:     5,
		Order:        6,
		EvaluationID: 4,
		IsGroup:      true,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Handled Well (จัดการได้ดี)", Score: 5},
			{Description: "Ignored (เพิกเฉย)", Score: 3},
			{Description: "Crashed (โปรแกรมล่ม)", Score: 0},
		},
	},
	// 4.4 Individual (5)
	{
		Name:         "Individual Understanding (ความเข้าใจรายบุคคล)",
		MaxScore:     5,
		Order:        7,
		EvaluationID: 4,
		IsGroup:      false,
		CriteriaLevel: []entity.CriteriaLevel{
			{Description: "Deep Understanding (เข้าใจลึกซึ้ง)", Score: 5},
			{Description: "Good Understanding (เข้าใจดี)", Score: 4},
			{Description: "Basic Understanding (เข้าใจพื้นฐาน)", Score: 3},
			{Description: "Low Understanding (เข้าใจน้อย)", Score: 1},
		},
	},
}
