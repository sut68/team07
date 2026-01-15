package progress

import (
	"context"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
)

const (
	MaxFileSize int64 = 20 * 1024 * 1024 // 20MB
	maxNameLen        = 120
	progressbug       = "progress"
)

var minioClient *minio.Client

func init() {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	if endpoint == "" {
		endpoint = "minio:9000"
	}

	accessKey := os.Getenv("MINIO_ROOT_USER")
	if accessKey == "" {
		accessKey = "admin"
	}

	secretKey := os.Getenv("MINIO_ROOT_PASSWORD")
	if secretKey == "" {
		secretKey = "install123"
	}

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: false,
	})
	if err != nil {
		fmt.Printf("minio fail: %v\n", err)
		return
	}
	minioClient = client

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	buckets := []string{progressbug}
	for _, b := range buckets {
		exists, err := minioClient.BucketExists(ctx, b)
		if err == nil && !exists {
			err = minioClient.MakeBucket(ctx, b, minio.MakeBucketOptions{})
			if err == nil {
				fmt.Printf("[INFO] Created bucket: %s\n", b)

				if b == progressbug {
					policy := fmt.Sprintf(`{"Version":"2012-10-17","Statement":[{"Action":["s3:GetObject"],"Effect":"Allow","Principal":"*","Resource":["arn:aws:s3:::%s/*"]}]}`, b)
					_ = minioClient.SetBucketPolicy(ctx, b, policy)
				}
			}
		}
	}
}


func sanitizeFilename(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "file"
	}

	name = filepath.Base(name)
	name = strings.ReplaceAll(name, "/", "_")
	name = strings.ReplaceAll(name, "\\", "_")

	var b strings.Builder
	b.Grow(len(name))
	for _, r := range name {
		if (r >= 'a' && r <= 'z') ||
			(r >= 'A' && r <= 'Z') ||
			(r >= '0' && r <= '9') ||
			r == '.' || r == '-' || r == '_' {
			b.WriteRune(r)
		} else {
			b.WriteRune('_')
		}
	}
	out := b.String()
	if out == "" {
		out = "file"
	}
	if len(out) > maxNameLen {
		out = out[:maxNameLen]
	}
	return out
}

func allowedProgressContentType(ct string) bool {

	switch ct {
	case "application/pdf",
		"image/jpeg", "image/png", "image/gif", "image/webp":
		return true
	default:
		return false
	}
}

func allowedProgressExt(ext string) bool {
	ext = strings.ToLower(ext)
	switch ext {
	case ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".docx":
		return true
	default:
		return false
	}
}

func detectContentTypeFromHeader(fh *multipart.FileHeader) (string, error) {
	f, err := fh.Open()
	if err != nil {
		return "", err
	}
	defer f.Close()

	buf := make([]byte, 512)
	n, err := f.Read(buf)
	if err != nil && !errors.Is(err, io.EOF) {
		return "", err
	}
	return http.DetectContentType(buf[:n]), nil
}

func safeRemoveUploadedProgressPath(fileURL string) {
	if strings.HasPrefix(fileURL, "/storage/"+progressbug+"/") {
		parts := strings.Split(fileURL, "/")
		if len(parts) > 0 {
			obj := parts[len(parts)-1]
			if obj != "" {
				_ = minioClient.RemoveObject(context.Background(), progressbug, obj, minio.RemoveObjectOptions{})
			}
		}
	}
}

func GetProGressByID(c *gin.Context) {
	db := database.DB()

	groupStr := c.Query("group_project_id")
	group64, err := strconv.ParseUint(groupStr, 10, 64)
	if err != nil || group64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group_project_id"})
		return
	}

	var groupProgress []entity.Progress
	if err := db.Where("group_project_id = ? AND deleted_at IS NULL", uint(group64)).
		Order("id DESC").
		Find(&groupProgress).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	log.InsertLog(c, 4)
	c.JSON(http.StatusOK, &groupProgress)
}

func GetGroupProjectIDByStudentID(c *gin.Context) {
	sidStr := c.Query("student_id")
	if sidStr == "" {
		sidStr = c.Param("student_id")
	}

	studentID64, err := strconv.ParseUint(sidStr, 10, 64)
	if err != nil || studentID64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid student_id"})
		return
	}
	studentID := uint(studentID64)

	db := database.DB()

	var gm entity.GroupMember
	err = db.Model(&entity.GroupMember{}).
		Where("student_id = ? AND deleted_at IS NULL", studentID).
		Order("id DESC").
		First(&gm).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusOK, gin.H{
				"group_project_id": 0,
				"message":          "you still don't have a group yet",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"group_project_id": gm.GroupProjectID})
}

func AssignProGress(c *gin.Context) {
	db := database.DB()

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, MaxFileSize)
	fh, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing or invalid file upload"})
		return
	}

	if fh.Size <= 0 || fh.Size > MaxFileSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file too large (max 20MB)"})
		return
	}

	groupStr := c.PostForm("group_project_id")
	group64, err := strconv.ParseUint(groupStr, 10, 64)
	if err != nil || group64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid group project id"})
		return
	}
	groupID := uint(group64)

	// TODO (SECURITY): verify caller can upload progress for this groupID

	var gp entity.GroupProject
	if err := db.Where("id = ?", groupID).First(&gp).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project_id"})
		return
	}

	name := strings.TrimSpace(c.PostForm("Name"))
	comment := strings.TrimSpace(c.PostForm("comment"))

	ct, err := detectContentTypeFromHeader(fh)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot read uploaded file"})
		return
	}
	if !allowedProgressContentType(ct) {
		c.JSON(http.StatusForbidden, gin.H{"error": "file type not allowed"})
		return
	}

	orig := sanitizeFilename(fh.Filename)
	ext := filepath.Ext(orig)
	if !allowedProgressExt(ext) {
		c.JSON(http.StatusForbidden, gin.H{"error": "file extension not allowed"})
		return
	}

	objectName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), orig)

	f, err := fh.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot open uploaded file"})
		return
	}
	defer f.Close()

	_, err = minioClient.PutObject(
		c.Request.Context(),
		progressbug,
		objectName,
		f,
		fh.Size,
		minio.PutObjectOptions{ContentType: ct},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cloud Storage Error"})
		return
	}

	progress := entity.Progress{
		GroupProjectID: groupID,
		File:           "/storage/" + progressbug + "/" + objectName,
		Name:           name,
		Comment:        comment,
	}

	if err := db.Create(&progress).Error; err != nil {
		_ = minioClient.RemoveObject(context.Background(), progressbug, objectName, minio.RemoveObjectOptions{})
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database save failed"})
		return
	}

	log.InsertLog(c, 5)
	c.JSON(http.StatusOK, progress)
}

func UpdateProGress(c *gin.Context) {
	db := database.DB()

	idStr := c.PostForm("id")
	proID64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || proID64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var prog entity.Progress
	if err := db.Where("id = ?", uint(proID64)).First(&prog).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, MaxFileSize)

	if fh, fileErr := c.FormFile("file"); fileErr == nil && fh != nil {
		if fh.Size <= 0 || fh.Size > MaxFileSize {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file too large (max 20MB)"})
			return
		}

		ct, err := detectContentTypeFromHeader(fh)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot read uploaded file"})
			return
		}
		if !allowedProgressContentType(ct) {
			c.JSON(http.StatusForbidden, gin.H{"error": "file type not allowed"})
			return
		}

		orig := sanitizeFilename(fh.Filename)
		ext := filepath.Ext(orig)
		if !allowedProgressExt(ext) {
			c.JSON(http.StatusForbidden, gin.H{"error": "file extension not allowed"})
			return
		}

		objectName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), orig)

		f, err := fh.Open()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot open uploaded file"})
			return
		}
		defer f.Close()

		_, err = minioClient.PutObject(
			c.Request.Context(),
			progressbug,
			objectName,
			f,
			fh.Size,
			minio.PutObjectOptions{ContentType: ct},
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Cloud Storage Error"})
			return
		}

		old := prog.File
		prog.File = "/storage/" + progressbug + "/" + objectName
		safeRemoveUploadedProgressPath(old)
	}

	if name := strings.TrimSpace(c.PostForm("Name")); name != "" {
		prog.Name = name
	}
	if comment := strings.TrimSpace(c.PostForm("comment")); comment != "" {
		prog.Comment = comment
	}

	if err := db.Save(&prog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot update progress"})
		return
	}

	log.InsertLog(c, 6)
	c.JSON(http.StatusOK, gin.H{"message": "update ok", "data": prog})
}

func DeleteProgress(c *gin.Context) {
	db := database.DB()

	idStr := c.Query("id")
	id64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var prog entity.Progress
	if err := db.Where("id = ?", uint(id64)).First(&prog).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	if err := db.Delete(&prog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete"})
		return
	}

	safeRemoveUploadedProgressPath(prog.File)

	log.InsertLog(c, 7)
	c.JSON(http.StatusOK, gin.H{"message": "successfully deleted"})
}
