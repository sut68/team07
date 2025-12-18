package progress

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
)

func ensureDir(dir string) error {
	return os.MkdirAll(dir, os.ModePerm)
}

func GetProGressByID(c *gin.Context) {
	db := database.DB()

	group_projectid := c.Query("group_project_id")
	var group_progress []entity.Progress

	db.Where("group_project_id = ?", group_projectid).Find(&group_progress)
	log.InsertLog(c, 4)

	c.JSON(http.StatusOK, &group_progress)
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

	db:= database.DB()

	var gm entity.GroupMember
	err = db.
		Model(&entity.GroupMember{}).
		Where("student_id = ?", studentID).
		Where("deleted_at IS NULL").
		Order("id DESC"). 
		First(&gm).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, gin.H{
				"group_project_id": 0,
				"message":"you still don't have a group yet",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"group_project_id": gm.GroupProjectID,
	})
}

func AssignProGress(c *gin.Context) {
	db := database.DB()

	c.Request.ParseMultipartForm(32 << 20)

	group_projectid := c.PostForm("group_project_id")
	name := c.PostForm("Name")
	comment := c.PostForm("comment")

	fh, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	contoint, err := strconv.ParseUint(group_projectid, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group project id"})
		return
	}

	var gp entity.GroupProject
	if err := db.Where("id = ?", uint(contoint)).First(&gp).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project_id"})
		return
	}

	uploadDir := "./uploads/progress"
	_ = os.MkdirAll(uploadDir, os.ModePerm)

	ext := filepath.Ext(fh.Filename)
	newName := strconv.FormatInt(time.Now().UnixNano(), 10) + ext
	savePath := filepath.Join(uploadDir, newName)

	if err := c.SaveUploadedFile(fh, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot save file"})
		return
	}

	progress := entity.Progress{
		GroupProjectID: uint(contoint),
		File:           "/uploads/progress/" + newName,
		Name:           name,
		Comment:        comment,
	}

	db.Create(&progress)
	log.InsertLog(c, 5)

	c.JSON(http.StatusOK, progress)
}

func UpdateProGress(c *gin.Context) {
	db := database.DB()

	idStr := c.PostForm("id")
	name := c.PostForm("Name")
	newcomment := c.PostForm("comment")

	pro_id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}

	// find existing
	var prog entity.Progress
	if err := db.Where("id = ?", uint(pro_id)).First(&prog).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	fh, fileErr := c.FormFile("file")
	if fileErr == nil && fh != nil {
		uploadDir := "./uploads/progress"
		if err := ensureDir(uploadDir); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create upload folder"})
			return
		}

		ext := filepath.Ext(fh.Filename)
		newName := strconv.FormatInt(time.Now().UnixNano(), 10) + ext
		savePath := filepath.Join(uploadDir, newName)

		if err := c.SaveUploadedFile(fh, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot save file"})
			return
		}

		prog.File = "/uploads/progress/" + newName
	}

	if name != "" {
		prog.Name = name
	}
	if newcomment != "" {
		prog.Comment = newcomment
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

	id_str := c.Query("id")
	id_int, _ := strconv.ParseInt(id_str, 10, 64)

	var group_progress []entity.Progress
	result := db.Where("id = ?", id_int).Find(&group_progress)
	if result.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	db.Delete(&entity.Progress{}, id_int)
	log.InsertLog(c, 7)
	c.JSON(http.StatusOK, "suscessfully delete")
}
