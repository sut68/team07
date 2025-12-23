package users

import (
	"encoding/csv"
	"fmt" // ✅ ต้องมี fmt
	"net/http"
	"regexp" // ✅ ต้องมี regexp
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
	"golang.org/x/crypto/bcrypt"
)

// HashPassword ทำการเข้ารหัสรหัสผ่าน
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// POST: /users/import-csv
func ImportUsersCSV(c *gin.Context) {
	// ✅ LOG จุดที่ 1: เช็คว่า Request เข้ามาถึงฟังก์ชันนี้ไหม
	fmt.Println("🚀 [DEBUG] Start ImportUsersCSV Function...")

	db := database.DB()

	// รับไฟล์จาก Form-Data
	file, err := c.FormFile("file")
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
	records, err := reader.ReadAll()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid CSV format"})
		return
	}

	// ✅ LOG จุดที่ 2: เช็คจำนวนแถวที่อ่านได้
	fmt.Printf("🚀 [DEBUG] อ่าน CSV ได้ทั้งหมด %d แถว (กำลังเริ่มตรวจสอบ Regex...)\n", len(records))

	var usernameRegex = regexp.MustCompile(`^B(65|66)\d{5}$`)
	var phoneRegex = regexp.MustCompile(`^\d{10}$`)

	var users []entity.User
	tx := db.Begin()

	// วนลูปอ่านข้อมูล (เริ่ม i = 1 เพื่อข้าม Header)
	for i := 1; i < len(records); i++ {
		row := records[i]

		if len(row) < 10 {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid column count at row " + strconv.Itoa(i+1)})
			return
		}

		username := row[0]
		// ✅ Validation 1: ตรวจ Username
		if !usernameRegex.MatchString(username) {
			fmt.Printf("❌ [DEBUG] Row %d Username ผิด: %s\n", i+1, username)
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Row %d: Username '%s' ไม่ถูกต้อง (ต้องขึ้นต้นด้วย B65 หรือ B66 ตามด้วยเลข 5 หลัก)", i+1, username),
			})
			return
		}

		phone := row[5]
		// ✅ Validation 2: ตรวจ Phone
		if !phoneRegex.MatchString(phone) {
			fmt.Printf("❌ [DEBUG] Row %d Phone ผิด: %s\n", i+1, phone)
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Row %d: Phone '%s' ไม่ถูกต้อง (ต้องเป็นตัวเลข 10 หลัก)", i+1, phone),
			})
			return
		}

		genderID, _ := strconv.Atoi(row[6])
		branchID, _ := strconv.Atoi(row[7])
		roleID, _ := strconv.Atoi(row[8])
		statusID, _ := strconv.Atoi(row[9])

		// ✅ Validation 3: ห้าม Import Admin
		if roleID == 1 {
			tx.Rollback()
			c.JSON(http.StatusForbidden, gin.H{
				"error": fmt.Sprintf("Row %d: ไม่อนุญาตให้ Import ผู้ใช้งานระดับ Admin", i+1),
			})
			return
		}

		hashedPassword, _ := HashPassword(row[1])

		user := entity.User{
			Username:  username,
			Password:  hashedPassword,
			Firstname: row[2],
			Lastname:  row[3],
			Email:     row[4],
			Phone:     phone,
			GenderID:  uint(genderID),
			BranchID:  uint(branchID),
			RoleID:    uint(roleID),
			StatusID:  uint(statusID),
		}
		users = append(users, user)
	}

	if err := tx.CreateInBatches(&users, 100).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save data: " + err.Error()})
		return
	}

	tx.Commit()
	fmt.Println("✅ [DEBUG] Import สำเร็จลง Database เรียบร้อย!")

	c.JSON(http.StatusOK, gin.H{
		"message": "Imported " + strconv.Itoa(len(users)) + " users successfully",
	})
}

// GET: /admin/users
func ListUsers(c *gin.Context) {
	db := database.DB()
	var users []entity.User

	if err := db.Preload("Gender").
		Preload("Branch").
		Preload("Role").
		Preload("Status").
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for i := range users {
		users[i].Password = ""
	}

	c.JSON(http.StatusOK, users)
}

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

// POST: /admin/user (Create User ทีละคน - เพิ่ม Validation แล้ว)
func CreateUser(c *gin.Context) {
	db := database.DB()
	var input CreateUserInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.RoleID == 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "ไม่อนุญาตให้สร้างบัญชีผู้ดูแลระบบ (Admin) เพิ่มเติม"})
		return
	}

	// ✅ เพิ่ม Validation Regex ตรงนี้ด้วย
	var usernameRegex = regexp.MustCompile(`^B(65|66)\d{5}$`)
	var phoneRegex = regexp.MustCompile(`^\d{10}$`)

	if !usernameRegex.MatchString(input.Username) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username ไม่ถูกต้อง (ต้องขึ้นต้นด้วย B65 หรือ B66 ตามด้วยเลข 5 หลัก)"})
		return
	}

	if !phoneRegex.MatchString(input.Phone) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 10 หลัก)"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), 14)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

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

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully", "data": user})
}

// Struct แก้ไข
type UpdateUserInfoInput struct {
	Firstname string `json:"firstname"`
	Lastname  string `json:"lastname"`
}

// PATCH: Update User
func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	db := database.DB()
	var input UpdateUserInfoInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user entity.User
	if err := db.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.RoleID == 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "ไม่อนุญาตให้แก้ไขข้อมูลผู้ดูแลระบบ (Admin)"})
		return
	}

	if err := db.Model(&user).Updates(map[string]interface{}{
		"Firstname": input.Firstname,
		"Lastname":  input.Lastname,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully", "data": user})
}

// UpdateUserProfile (สำหรับ User แก้ไขตัวเอง - แค่ Email/Phone)
type UpdateUserProfileInput struct {
	Email string `json:"email"`
	Phone string `json:"phone"`
}

func UpdateUserProfile(c *gin.Context) {
	db := database.DB()
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userId := claims.ID

	var input UpdateUserProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user entity.User
	if err := db.First(&user, userId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := db.Model(&user).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Update profile successfully",
		"data":    user,
	})
}

// DELETE: /admin/user/:id
func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	db := database.DB()

	var user entity.User
	if err := db.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.RoleID == 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "ไม่สามารถลบบัญชีผู้ดูแลระบบ (Admin) ได้"})
		return
	}

	if err := db.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// GET: /getUserProfile
func GetUserProfile(c *gin.Context) {
	db := database.DB()
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userId := claims.ID

	var user entity.User
	if err := db.Preload("Gender").
		Preload("Branch").
		Preload("Role").
		Preload("Status").
		First(&user, userId).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.Password = ""
	c.JSON(http.StatusOK, gin.H{
		"data": user,
	})
}

func GetGenders(c *gin.Context) {
	var genders []entity.Gender
	if err := database.DB().Find(&genders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, genders)
}

func GetBranches(c *gin.Context) {
	var branches []entity.Branch
	if err := database.DB().Find(&branches).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, branches)
}

func GetRoles(c *gin.Context) {
	var roles []entity.UserRole
	if err := database.DB().Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, roles)
}

func GetUserStatuses(c *gin.Context) {
	var statuses []entity.AccountStatus
	if err := database.DB().Find(&statuses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, statuses)
}
