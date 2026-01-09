package progress

import (
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
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
)

const (
	MaxFileSize int64 = 20 * 1024 * 1024 // 20MB
	maxNameLen        = 120
)


func ensureDir(dir string) error {
	return os.MkdirAll(dir, 0755)
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
	// only delete within our upload folder
	if strings.HasPrefix(fileURL, "/uploads/progress/") {
		_ = os.Remove("." + fileURL) // "/uploads/..." -> "./uploads/..."
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

	// Validate group exists
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

	uploadDir := "./uploads/progress"
	if err := ensureDir(uploadDir); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create upload folder"})
		return
	}

	orig := sanitizeFilename(fh.Filename)
	ext := filepath.Ext(orig)
	if !allowedProgressExt(ext) {
		c.JSON(http.StatusForbidden, gin.H{"error": "file extension not allowed"})
		return
	}

	newName := fmt.Sprintf("%d%s", time.Now().UnixNano(), strings.ToLower(ext))
	savePath := filepath.Join(uploadDir, newName)

	if err := c.SaveUploadedFile(fh, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}

	progress := entity.Progress{
		GroupProjectID: groupID,
		File:           "/uploads/progress/" + newName,
		Name:           name,
		Comment:        comment,
	}

	if err := db.Create(&progress).Error; err != nil {
		_ = os.Remove(savePath)
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

		uploadDir := "./uploads/progress"
		if err := ensureDir(uploadDir); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create upload folder"})
			return
		}

		orig := sanitizeFilename(fh.Filename)
		ext := filepath.Ext(orig)
		if !allowedProgressExt(ext) {
			c.JSON(http.StatusForbidden, gin.H{"error": "file extension not allowed"})
			return
		}

		newName := fmt.Sprintf("%d%s", time.Now().UnixNano(), strings.ToLower(ext))
		savePath := filepath.Join(uploadDir, newName)

		if err := c.SaveUploadedFile(fh, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot save file"})
			return
		}


		old := prog.File
		prog.File = "/uploads/progress/" + newName
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
