package users

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"regexp"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
	"github.com/sut68/team07/backend/service"
)

// Regex สำหรับตรวจสอบ Email: ต้องเป็นภาษาอังกฤษ ตัวเลข หรือ . _ % + - และต้องมี @ และโดเมน (เช่น .com, .co.th)
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// Regex สำหรับตรวจสอบ Phone: ต้องเป็นตัวเลข 10 หลักเท่านั้น
var phoneRegex = regexp.MustCompile(`^\d{10}$`)

// POST: /users/import-csv
func ImportUsersCSV(c *gin.Context) {
	db := database.DB()
	jwtService := service.NewJwtService()

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
		// password := row[1]
		firstname := row[2]
		lastname := row[3]
		email := row[4]
		phone := row[5]

		// Validation: ตรวจ Email Regex (ถ้ามีค่า)
		if email != "" && !emailRegex.MatchString(email) {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Row %d: Email '%s' รูปแบบไม่ถูกต้อง (ต้องเป็นภาษาอังกฤษและมีโดเมนที่ถูกต้อง)", i+1, email),
			})
			return
		}

		// Validation: ตรวจ Phone Regex (ถ้ามีค่า)
		if phone != "" && !phoneRegex.MatchString(phone) {
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

		// Validation: ห้าม Import Admin
		if roleID == 1 {
			tx.Rollback()
			c.JSON(http.StatusForbidden, gin.H{
				"error": fmt.Sprintf("Row %d: ไม่อนุญาตให้ Import ผู้ใช้งานระดับ Admin", i+1),
			})
			return
		}

		// Validation: ตรวจสอบข้อมูลซ้ำ (Unique Check)
		var checkUser entity.User

		// Username
		if err := db.Where("username = ?", username).First(&checkUser).Error; err == nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Row %d: Username '%s' ซ้ำกับ User: %s (ชื่อ: %s %s)",
				i+1, username, checkUser.Username, checkUser.Firstname, checkUser.Lastname)})
			return
		}

		// Email
		if email != "" {
			if err := db.Where("email = ?", email).First(&checkUser).Error; err == nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Row %d: Email '%s' ซ้ำกับ User: %s (ชื่อ: %s %s)",
					i+1, email, checkUser.Username, checkUser.Firstname, checkUser.Lastname)})
				return
			}
		}

		// Phone
		if phone != "" { // แก้ไข: เช็คเฉพาะถ้ามีเบอร์โทร
			if err := db.Where("phone = ?", phone).First(&checkUser).Error; err == nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Row %d: Phone '%s' ซ้ำกับ User: %s (ชื่อ: %s %s)",
					i+1, phone, checkUser.Username, checkUser.Firstname, checkUser.Lastname)})
				return
			}
		}

		// Firstname + Lastname
		if err := db.Where("firstname = ? AND lastname = ?", firstname, lastname).First(&checkUser).Error; err == nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Row %d: ชื่อ-นามสกุล '%s %s' ซ้ำกับ User: %s (ID: %d)",
				i+1, firstname, lastname, checkUser.Username, checkUser.ID)})
			return
		}

		hashedPassword := jwtService.HashPassword(row[1])

		// กำหนดค่า Pass
		var pass *bool
		if roleID == 3 {
			isPass := false
			pass = &isPass
		} else {
			pass = nil
		}

		user := entity.User{
			Username:  username,
			Password:  hashedPassword,
			Firstname: firstname,
			Lastname:  lastname,
			Email:     email,
			Phone:     phone,
			GenderID:  uint(genderID),
			BranchID:  uint(branchID),
			RoleID:    uint(roleID),
			StatusID:  uint(statusID),
			Pass:      pass,
		}
		users = append(users, user)
	}

	if err := tx.CreateInBatches(&users, 100).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save data: " + err.Error()})
		return
	}

	tx.Commit()
	fmt.Println("[DEBUG] Import สำเร็จ!")
	log.InsertLog(c, 47)
	c.JSON(http.StatusOK, gin.H{
		"message": "Imported " + strconv.Itoa(len(users)) + " users successfully",
	})
}

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

// POST: /admin/user (Create User ทีละคน)
func CreateUser(c *gin.Context) {
	db := database.DB()
	var input CreateUserInput
	jwtService := service.NewJwtService()

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.RoleID == 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "ไม่อนุญาตให้สร้างบัญชีผู้ดูแลระบบ (Admin) เพิ่มเติม"})
		return
	}

	// Validation: ตรวจ Phone Regex (ถ้ามีค่า)
	if input.Phone != "" && !phoneRegex.MatchString(input.Phone) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 10 หลัก)"})
		return
	}

	// Validation: ตรวจ Email Regex (ถ้ามีค่า)
	if input.Email != "" && !emailRegex.MatchString(input.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบ Email ไม่ถูกต้อง (ต้องเป็นภาษาอังกฤษและมีโดเมนที่ถูกต้อง)"})
		return
	}

	// -----------------------------------------------------
	// ตรวจสอบข้อมูลซ้ำ (Unique Check)
	// -----------------------------------------------------
	var checkUser entity.User

	// Username
	if err := db.Where("username = ?", input.Username).First(&checkUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username นี้มีอยู่ในระบบแล้ว"})
		return
	}

	// Email
	if input.Email != "" {
		if err := db.Where("email = ?", input.Email).First(&checkUser).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email นี้มีอยู่ในระบบแล้ว"})
			return
		}
	}

	// Phone
	if input.Phone != "" {
		if err := db.Where("phone = ?", input.Phone).First(&checkUser).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว"})
			return
		}
	}

	// Firstname + Lastname
	if err := db.Where("firstname = ? AND lastname = ?", input.Firstname, input.Lastname).First(&checkUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ชื่อและนามสกุลนี้มีอยู่ในระบบแล้ว"})
		return
	}

	// -----------------------------------------------------

	hashedPassword := jwtService.HashPassword(input.Password)

	// กำหนดค่า Pass
	var pass *bool
	if input.RoleID == 3 {
		isPass := false
		pass = &isPass
	} else {
		pass = nil
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
		Pass:      pass,
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.InsertLog(c, 29)
	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully", "data": user})
}

type UpdateUserInfoInput struct {
	Firstname string `json:"firstname"`
	Lastname  string `json:"lastname"`
	StatusID  uint   `json:"status_id"`
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

	var checkUser entity.User
	if err := db.Where("firstname = ? AND lastname = ? AND id != ?", input.Firstname, input.Lastname, id).First(&checkUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ชื่อและนามสกุลนี้มีอยู่แล้วในระบบ"})
		return
	}

	if err := db.Model(&user).Updates(map[string]interface{}{
		"Firstname": input.Firstname,
		"Lastname":  input.Lastname,
		"StatusID":  input.StatusID,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}
	log.InsertLog(c, 30)
	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully", "data": user})
}

// UpdateUserProfile (User แก้ไขตัวเอง)
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

	// Validation: ตรวจ Phone Regex (ถ้ามีค่า)
	if input.Phone != "" && !phoneRegex.MatchString(input.Phone) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 10 หลัก)"})
		return
	}

	// Validation: ตรวจ Email Regex (ถ้ามีค่า)
	if input.Email != "" && !emailRegex.MatchString(input.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบ Email ไม่ถูกต้อง (ต้องเป็นภาษาอังกฤษและมีโดเมนที่ถูกต้อง)"})
		return
	}

	var user entity.User
	if err := db.First(&user, userId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// เช็ค Email ซ้ำกับคนอื่น (ไม่รวมตัวเอง)
	var checkUser entity.User
	if input.Email != "" {
		if err := db.Where("email = ? AND id != ?", input.Email, userId).First(&checkUser).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email นี้ถูกใช้งานแล้ว"})
			return
		}
	}

	// เช็ค Phone ซ้ำกับคนอื่น (ไม่รวมตัวเอง)
	if input.Phone != "" {
		if err := db.Where("phone = ? AND id != ?", input.Phone, userId).First(&checkUser).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว"})
			return
		}
	}

	if err := db.Model(&user).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}
	log.InsertLog(c, 30)
	c.JSON(http.StatusOK, gin.H{
		"message": "Update profile successfully",
		"data":    user,
	})
}

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
	log.InsertLog(c, 31)
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
