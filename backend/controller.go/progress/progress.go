package progress

import (
	"net/http"
	"time"
	"strconv"


	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/controller.go/log"
)

func GetProGressByID(c *gin.Context) {

	db := database.DB()

	var  group_projectid = c.Query("group_project_id")
	var group_progress [] entity.Progress

	db.Where("group_project_id = ?", group_projectid).Find(&group_progress)
	log.InsertLog(c,4)

	c.JSON(http.StatusOK, &group_progress)
}

func AssignProGress(c * gin.Context) {
	
	db := database.DB()


	var   group_projectid = c.Query("group_project_id")
	var   file_progress  = c.Query("file")
	if file_progress == ""{
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is needed"})
    	return
	}
	contoint, err := strconv.ParseUint(group_projectid, 10, 64)

	if err != nil{
		c.JSON(400, gin.H{"error": "Invalid group project id "})
		return
	}

	int_group_id := uint(contoint)

	Progresses := []entity.Progress{
		{	
			GroupProjectID: 	int_group_id, 
			File: 				file_progress, 
		},
	}

	db.Create(&Progresses)
	log.InsertLog(c,5)

	c.JSON(http.StatusOK, &Progresses)
}

func UpdateProGress(c * gin.Context) {
	db := database.DB()

	var prostring = c.Query("id")
	var pro_id,_  = strconv.ParseUint(prostring, 10, 64)
	var newfile = c.Query("file")
	
	if newfile == ""{
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is needed"})
    	return
	}

	type newUpdate struct {
    	File string
    	Send time.Time
	}
	

	db.Model(&entity.Progress{}).Where("id = ?", uint(pro_id)).

	Updates(newUpdate{
		File: newfile,
        Send: time.Now(),
	})
	log.InsertLog(c,6)
	c.JSON(http.StatusOK,"update ok")
}

func DeleteProgress(c * gin.Context) {
	db := database.DB()

	var id_str = c.Query("id")
	id_int,_ := strconv.ParseInt(id_str,10,64)

	db.Delete(&entity.Progress{}, id_int)
	log.InsertLog(c,7)
	c.JSON(http.StatusOK,"suscessfully delete")

}