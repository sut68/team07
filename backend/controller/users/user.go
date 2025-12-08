package users

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"

	// "github.com/sut68/team07/backend/middleware"
	"encoding/csv"
	"strconv"
	"golang.org/x/crypto/bcrypt"
)



func GetGender(c *gin.Context) {
	db := database.DB()

	var genders []entity.Gender
	db.Find(&genders)

	c.JSON(http.StatusOK, genders)
}

// GET: /getUserProfile
func GetUserProfile(c *gin.Context) {
    db := database.DB()

    // 1. ดึง Claims จาก Context
    claims, err := middleware.GetClaimsFromContext(c)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
        return
    }
    userId := claims.ID

    var user entity.User

    // 2. Query ข้อมูลพร้อม Preload ตารางที่เกี่ยวข้อง
    // Preload จะไปดึงข้อมูลจากตาราง Gender, Branch, Role, Status มาใส่ใน field ของ User ให้
    if err := db.Preload("Gender").
        Preload("Branch").
        Preload("Role").
        Preload("Status").
        First(&user, userId).Error; err != nil {
            
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }

    // 3. (สำคัญ) ลบ Password ออกก่อนส่งกลับ เพื่อความปลอดภัย
    user.Password = "" 

    // 4. ส่งข้อมูลกลับ
    c.JSON(http.StatusOK, gin.H{
        "data": user,
    })
}

// รับค่าเฉพาะ Email และ Phone เท่านั้น
type UpdateUserProfileInput struct {
	Email string `json:"email"`
	Phone string `json:"phone"`
}

func UpdateUserProfile(c *gin.Context) {
	db := database.DB()

	// 1. ดึง ID จาก Token
	claims, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userId := claims.ID

	// 2. รับค่า Input (จะมีแค่ Email, Phone)
	var input UpdateUserProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3. หา User
	var user entity.User
	if err := db.First(&user, userId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// 4. อัปเดตข้อมูล
	// GORM จะสร้าง SQL Update เฉพาะ column email และ phone
	// หมายเหตุ: ถ้าส่งค่าว่างมา ("") GORM struct update ปกติจะข้ามไป (ไม่ลบข้อมูลเดิม)
	if err := db.Model(&user).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Update profile successfully",
		"data":    user,
	})
}

// HashPassword ทำการเข้ารหัสรหัสผ่าน
// ต้องขึ้นต้นด้วย H ตัวใหญ่เพื่อให้ Controller เรียกใช้ได้
func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
    return string(bytes), err
}

// POST: /users/import-csv
func ImportUsersCSV(c *gin.Context) {
	db := database.DB()

	// 1. รับไฟล์จาก Form-Data
	file, err := c.FormFile("file") // "file" คือชื่อ key ที่ frontend ต้องส่งมา
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	// 2. เปิดไฟล์เพื่ออ่าน
	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot open file"})
		return
	}
	defer f.Close()

	// 3. อ่านข้อมูล CSV
	reader := csv.NewReader(f)
	records, err := reader.ReadAll() // อ่านทั้งหมดทีเดียว (ระวังถ้าไฟล์ใหญ่มากอาจต้องอ่านทีละบรรทัด)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid CSV format"})
		return
	}

	// 4. เตรียมตัวแปร
	var users []entity.User

	// เริ่ม Transaction (ถ้ามี error แม้แต่คนเดียว จะไม่บันทึกเลยสักคน เพื่อความปลอดภัย)
	tx := db.Begin()

	// 5. วนลูปอ่านข้อมูล (เริ่ม i = 1 เพื่อข้าม Header บรรทัดแรก)
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

	// 6. บันทึกลง Database ทีเดียว (Batch Insert)
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
