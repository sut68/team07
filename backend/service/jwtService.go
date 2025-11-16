package service

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sut68/team07/backend/config"
	"github.com/sut68/team07/backend/entity"
	"golang.org/x/crypto/bcrypt" 
	"gorm.io/gorm"
)

type Claims struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// JwtService Interface
type JwtService interface {
	HashPassword(password string) string
	CheckPasswordHash(password, hash string) bool
	GenerateToken(user *entity.User, duration time.Duration) (string, error)
	ValidateToken(tokenStr string) (*Claims, error)
	SaveRefreshToken(db *gorm.DB, tokenStr string, userID uint) error
	CheckAndRevokeRefreshToken(db *gorm.DB, tokenStr string, userID uint) error
	HashTokenSHA256(tokenStr string) string
}

type jwtServiceImpl struct{}

func NewJwtService() JwtService {
	return &jwtServiceImpl{}
}

func (s *jwtServiceImpl) HashPassword(password string) string {
	bytes, _ := bcrypt.GenerateFromPassword([]byte(password), 12)
	return string(bytes)
}

func (s *jwtServiceImpl) CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) 
	return err == nil
}

//สร้าง JWT
func (s *jwtServiceImpl) GenerateToken(user *entity.User, duration time.Duration) (string, error) {
	roleName := user.Role.Role 

	claims := &Claims{
		ID:       user.ID,
		Username: user.Username,
		Role:     roleName, 
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "team07-backend",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	
	// ลงนาม Token ด้วย Secret Key
	return token.SignedString(config.JwtSecret()) 
}

//ใช้ตรวจสอบความถูกต้องและลายเซ็นของ JWT
func (s *jwtServiceImpl) ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		// คืนค่า Secret Key เพื่อใช้ยืนยันลายเซ็น
		return config.JwtSecret(), nil
	})

	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid claims or token not valid")
	}

	return claims, nil
}


func HashTokenSHA256(tokenStr string) string {
	hash := sha256.New()
	hash.Write([]byte(tokenStr))
	return hex.EncodeToString(hash.Sum(nil))
}

func (s *jwtServiceImpl) HashTokenSHA256(tokenStr string) string {
    return HashTokenSHA256(tokenStr)
}

// บันทึก Refresh Token ใหม่ลงฐานข้อมูล
func (s *jwtServiceImpl) SaveRefreshToken(db *gorm.DB, tokenStr string, userID uint) error {
	tokenHash := HashTokenSHA256(tokenStr)

	// ดึงค่า ExpiresAt มาบันทึกใน DB
	claims, err := s.ValidateToken(tokenStr)
	if err != nil {
		return fmt.Errorf("invalid token during save: %w", err)
	}

	// สร้าง Entity และบันทึก
	newToken := entity.RefreshToken{
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: claims.ExpiresAt.Unix(), // เก็บวันหมดอายุ
		IsRevoked: false,
	}

	if err := db.Create(&newToken).Error; err != nil {
		return fmt.Errorf("failed to save refresh token: %w", err)
	}

	return nil 
}

// ตรวจสอบความถูกต้อง, ลบ Token เก่า, และป้องกัน Token Replay Attack
func (s *jwtServiceImpl) CheckAndRevokeRefreshToken(db *gorm.DB, tokenStr string, userID uint) error {
	//Hash Token เพื่อใช้ค้นหาใน DB
	tokenHash := HashTokenSHA256(tokenStr)

	var token entity.RefreshToken
	//ค้นหา Token ใน DB โดยใช้ Hash และ UserID
	if err := db.Where("user_id = ? AND token_hash = ?", userID, tokenHash).First(&token).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			s.revokeAllTokensForUser(db, userID)
			return fmt.Errorf("refresh token not found (potential replay attack)")
		}
		return fmt.Errorf("database query error: %w", err)
	}

	//ตรวจสอบว่า Token ถูกเพิกถอนแล้วหรือไม่
	if token.IsRevoked {
		return errors.New("token family already revoked, force re-login") 
	}

	//ตรวจสอบ Cooldown (ป้องกันการยิง Refresh รัวๆ)
	if time.Now().Before(token.CreatedAt.Add(config.RefreshCooldown())) {
		s.revokeAllTokensForUser(db, userID)
		return errors.New("refresh cooldown violation, session revoked")
	}

	// ตรวจสอบวันหมดอายุ
	if time.Now().Unix() > token.ExpiresAt {
		db.Delete(&token)
		return errors.New("refresh token expired")
	}

	//ลบ Token เก่าออกจาก DB (Token Rotation)
	if err := db.Delete(&token).Error; err != nil {
		return fmt.Errorf("failed to delete old refresh token: %w", err)
	}

	return nil
}

//ตั้งค่า IsRevoked = true ให้ Token ทั้งหมดที่ยังไม่หมดอายุ
func (s *jwtServiceImpl) revokeAllTokensForUser(db *gorm.DB, userID uint) error {
	return db.Model(&entity.RefreshToken{}).
		Where("user_id = ? AND expires_at > ? AND is_revoked = ?", userID, time.Now().Unix(), false).
		Update("is_revoked", true).Error
}
