package entity

import "gorm.io/gorm"

type User struct {
    gorm.Model
    Username string `json:"username" valid:"required~Username is required"`
    Password string `gorm:"not null" json:"-" valid:"required~Password is required"`
	Firstname string `json:"firstname" valid:"required~Firstname is required"`
	Lastname  string `json:"lastname" valid:"required~Lastname is required"`
	Email     string `json:"email" valid:"required~Email is required,email~Invalid email format"`
	Phone     string `json:"phone" valid:"required~Phone is required"`
    Pass    *bool   `json:"pass"`

	GenderID uint   `json:"gender_id"`
	Gender   *Gender `gorm:"foreignKey:GenderID" json:"gender"`
	BranchID uint    `json:"branch_id"`
	Branch   *Branch `gorm:"foreignKey:BranchID" json:"branch"`
    RoleID uint          `json:"role_id"`
    Role   *UserRole `gorm:"foreignKey:RoleID" json:"role"`
    StatusID uint          `json:"status_id"`
    Status   *AccountStatus `gorm:"foreignKey:StatusID" json:"status"`

	GroupProjects []GroupProject `gorm:"foreignKey:TeacherID" json:"group_projects"`
	GroupMembers  []GroupMember  `gorm:"foreignKey:StudentID" json:"group_members"`
	SelectAdvisors []SelectAdvisor `gorm:"foreignKey:TeacherID" json:"select_advisors"`
	ChatsSent     []Chat         `gorm:"foreignKey:SenderID" json:"chats_sent"`
	IssueReports []IssueReport `gorm:"foreignKey:UserID" json:"issue_reports"`
	ProjectStorages []ProjectStorage `gorm:"foreignKey:TeacherID" json:"project_storages"`
	TopicApprovals []TopicApproval `gorm:"foreignKey:TeacherID" json:"topic_approvals"`
	IndividualScores []IndividualScore `gorm:"foreignKey:StudentID" json:"individual_scores"`
	IndividualScore []IndividualScore `gorm:"foreignKey:TeacherID" json:"individual_score"`
	EvaResults      []EvaResult      `gorm:"foreignKey:TeacherID" json:"eva_results"`
	Schedules      []Schedule      `gorm:"foreignKey:TeacherID" json:"schedules"`
	Logs		  []Log           `gorm:"foreignKey:UserID" json:"logs"`
	RefreshTokens  []RefreshToken `gorm:"foreignKey:UserID" json:"refresh_tokens"`
	ResetPasswordTokens []ResetPasswordToken `gorm:"foreignKey:UserID" json:"reset_password_tokens"`
	PasswordHistory []PasswordHistory `gorm:"foreignKey:UserID" json:"password_history"`
	
}

