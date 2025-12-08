package service

import (
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"

	"github.com/xuri/excelize/v2"
	"golang.org/x/crypto/bcrypt"
)

func ImportUsersFromFile(filePath string) (int, []string, error) {

	var rows [][]string

	// อ่าน CSV
	if strings.HasSuffix(strings.ToLower(filePath), ".csv") {
		f, err := os.Open(filePath)
		if err != nil {
			return 0, nil, err
		}
		defer f.Close()

		reader := csv.NewReader(f)
		rows, err = reader.ReadAll()
		if err != nil {
			return 0, nil, err
		}
	} else {
		// อ่าน Excel
		excel, err := excelize.OpenFile(filePath)
		if err != nil {
			return 0, nil, err
		}
		sheet := excel.GetSheetName(0)
		rows, err = excel.GetRows(sheet)
		if err != nil {
			return 0, nil, err
		}
	}

	imported := 0
	errors := []string{}
	db := database.DB()

	for i, row := range rows {
		if i == 0 {
			continue // skip header
		}

		// row ต้องมีครบทุกช่อง
		if len(row) < 10 {
			errors = append(errors, fmt.Sprintf("Row %d: missing required fields", i+1))
			continue
		}

		genderID, _ := strconv.ParseUint(row[6], 10, 64)
		branchID, _ := strconv.ParseUint(row[7], 10, 64)
		roleID, _ := strconv.ParseUint(row[8], 10, 64)
		statusID, _ := strconv.ParseUint(row[9], 10, 64)

		// hash password
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(row[1]), bcrypt.DefaultCost)

		user := entity.User{
			Username: row[0],
			Password: string(hashedPassword), // ⚠ คุณเก็บ password field เดิม แต่ต้องบันทึก hash
			Firstname: row[2],
			Lastname: row[3],
			Email: row[4],
			Phone: row[5],
			GenderID: uint(genderID),
			BranchID: uint(branchID),
			RoleID: uint(roleID),
			StatusID: uint(statusID),
		}

		if err := db.Create(&user).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: %s", i+1, err.Error()))
			continue
		}

		imported++
	}

	return imported, errors, nil
}
