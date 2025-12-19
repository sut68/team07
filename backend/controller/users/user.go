package users

import (
	"encoding/csv"
	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"strconv"
)

// HashPassword ทำการเข้ารหัสรหัสผ่าน
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// POST: /users/import-csv
func ImportUsersCSV(c *gin.Context) {
	db := database.DB()

	// รับไฟล์จาก Form-Data
	file, err := c.FormFile("file") // "file" คือชื่อ key ที่ frontend ต้องส่งมา
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	// เปิดไฟล์เพื่ออ่าน
	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot open file"})
		return
	}
	defer f.Close()

	// อ่านข้อมูล CSV
	reader := csv.NewReader(f)
	records, err := reader.ReadAll() // อ่านทั้งหมดทีเดียว
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid CSV format"})
		return
	}

	// เตรียมตัวแปร
	var users []entity.User

	// เริ่ม Transaction (ถ้ามี error แม้แต่คนเดียว จะไม่บันทึกเลยสักคน เพื่อความปลอดภัย)
	tx := db.Begin()

	// วนลูปอ่านข้อมูล (เริ่ม i = 1 เพื่อข้าม Header บรรทัดแรก)
	for i := 1; i < len(records); i++ {
		row := records[i]

		// ตรวจสอบความยาว column (กันไฟล์ผิด format)
		if len(row) < 10 {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid column count at row " + strconv.Itoa(i+1)})
			return
		}

		// แปลง String เป็น ID (Uint)
		genderID, _ := strconv.Atoi(row[6])
		branchID, _ := strconv.Atoi(row[7])
		roleID, _ := strconv.Atoi(row[8])
		statusID, _ := strconv.Atoi(row[9])

		// Hash Password (เรียกใช้ Service ของคุณ)
		hashedPassword, _ := HashPassword(row[1])

		// สร้าง Object User
		user := entity.User{
			Username:  row[0],
			Password:  hashedPassword,
			Firstname: row[2],
			Lastname:  row[3],
			Email:     row[4],
			Phone:     row[5],
			GenderID:  uint(genderID),
			BranchID:  uint(branchID),
			RoleID:    uint(roleID),
			StatusID:  uint(statusID),
		}
		users = append(users, user)
	}

	// บันทึกลง Database ทีเดียว
	// แบ่ง batch ละ 100 คน เพื่อประสิทธิภาพ
	if err := tx.CreateInBatches(&users, 100).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save data: " + err.Error()})
		return
	}

	// ยืนยันข้อมูล
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "Imported " + strconv.Itoa(len(users)) + " users successfully",
	})
}

// GET: /admin/users (สำหรับ Admin)
func ListUsers(c *gin.Context) {
	db := database.DB()
	var users []entity.User

	// Preload ข้อมูล Relation ทั้งหมดเพื่อนำมาแสดงในตาราง
	if err := db.Preload("Gender").
		Preload("Branch").
		Preload("Role").
		Preload("Status").
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ลบ Password ออกก่อนส่งกลับ
	for i := range users {
		users[i].Password = ""
	}

	c.JSON(http.StatusOK, users)
}

// Struct สำหรับรับค่าการสร้าง User
type CreateUserInput struct {
	Username  string `json:"username" binding:"required"`
	Password  string `json:"password" binding:"required"`
	Firstname string `json:"firstname" binding:"required"`
	Lastname  string `json:"lastname" binding:"required"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	GenderID  uint   `json:"gender_id"`
	BranchID  uint   `json:"branch_id"`
	RoleID    uint   `json:"role_id"`
	StatusID  uint   `json:"status_id"`
}

// POST: /admin/user (สร้าง User ใหม่)
func CreateUser(c *gin.Context) {
	db := database.DB()
	var input CreateUserInput

	// รับค่า
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ป้องกันการสร้าง Admin
	if input.RoleID == 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "ไม่อนุญาตให้สร้างบัญชีผู้ดูแลระบบ (Admin) เพิ่มเติม"})
		return
	}

	// Hash Password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), 14)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// สร้าง Object User
	user := entity.User{
		Username:  input.Username,
		Password:  string(hashedPassword),
		Firstname: input.Firstname,
		Lastname:  input.Lastname,
		Email:     input.Email,
		Phone:     input.Phone,
		GenderID:  input.GenderID,
		BranchID:  input.BranchID,
		RoleID:    input.RoleID,
		StatusID:  input.StatusID,
	}

	// บันทึก
	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully", "data": user})
}

// รับค่าเฉพาะ Email และ Phone เท่านั้น
type UpdateUserProfileInput struct {
	Email string `json:"email"`
	Phone string `json:"phone"`
}

func UpdateUserProfile(c *gin.Context) {
	db := database.DB()

	// ดึง ID จาก Token
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userId := claims.ID

	// รับค่า Input (จะมีแค่ Email, Phone)
	var input UpdateUserProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// หา User
	var user entity.User
	if err := db.First(&user, userId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// อัปเดตข้อมูล
	// GORM จะสร้าง SQL Update เฉพาะ column email และ phone
	if err := db.Model(&user).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Update profile successfully",
		"data":    user,
	})
}

// DELETE: /admin/user/:id (ลบผู้ใช้งาน)
func DeleteUser(c *gin.Context) {
	id := c.Param("id") // รับ ID จาก URL
	db := database.DB()

	// หา User ก่อน เพื่อเช็ค Role
	var user entity.User
	if err := db.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// เช็ค: ห้ามลบ Admin
	if user.RoleID == 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "ไม่สามารถลบบัญชีผู้ดูแลระบบ (Admin) ได้"})
		return
	}

	// ลบข้อมูล
	if err := db.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// GET: /getUserProfile
func GetUserProfile(c *gin.Context) {
	db := database.DB()

	// ดึง Claims จาก Context
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userId := claims.ID

	var user entity.User

	// Query ข้อมูลพร้อม Preload ตารางที่เกี่ยวข้อง
	// Preload จะไปดึงข้อมูลจากตาราง Gender, Branch, Role, Status มาใส่ใน field ของ User ให้
	if err := db.Preload("Gender").
		Preload("Branch").
		Preload("Role").
		Preload("Status").
		First(&user, userId).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// (สำคัญ) ลบ Password ออกก่อนส่งกลับ เพื่อความปลอดภัย
	user.Password = ""

	// ส่งข้อมูลกลับ
	c.JSON(http.StatusOK, gin.H{
		"data": user,
	})
}

// GET: /admin/genders
func GetGenders(c *gin.Context) {
	var genders []entity.Gender
	if err := database.DB().Find(&genders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, genders)
}

// GET: /admin/branches
func GetBranches(c *gin.Context) {
	var branches []entity.Branch
	if err := database.DB().Find(&branches).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, branches)
}

// GET: /admin/roles
func GetRoles(c *gin.Context) {
	var roles []entity.UserRole
	if err := database.DB().Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, roles)
}

// GET: /admin/statuses
func GetUserStatuses(c *gin.Context) {
	var statuses []entity.AccountStatus
	if err := database.DB().Find(&statuses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, statuses)
}
