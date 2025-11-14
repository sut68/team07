package config

import "golang.org/x/crypto/bcrypt"

func HashPassword(password string) (string) {
	bytes, _ := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes)
}
//function สำหรับ check password ที่ hash แล้ว ว่าตรงกันหรือไม่
// func CheckPasswordHash(password, hash[byte]) bool {
// 	err := bcrypt.CompareHashAndPassword(hash, password)

// 	return err == nil
// }
