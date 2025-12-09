package progress

import (
	"net/http"
	"strconv"


	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/controller/log"
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
	var   comment  = c.Query("comment")
	if file_progress == ""{
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is needed"})
    	return
	}
	contoint, err := strconv.ParseUint(group_projectid, 10, 64)

	if err != nil{
		c.JSON(400, gin.H{"error": "Invalid group project id "})
		return
	}

	var group_progress [] entity.GroupProject
	result := db.Where("id = ?", contoint).Find(&group_progress)
	if result.RowsAffected == 0{
		c.JSON(http.StatusBadRequest,gin.H{"error":"invalid project_id this id not appear on database"})
		return
	}

	Progresses := []entity.Progress{
		{	
			GroupProjectID: 	uint(contoint), 
			File: 				file_progress, 
			Comment: 			comment,
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
	var newcomment = c.Query("comment")
	
	if newfile == ""{
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is needed(must be valid)"})
    	return
	}

	var group_progress [] entity.Progress
	result := db.Where("id = ?", pro_id).Find(&group_progress)
	if result.RowsAffected == 0{
		c.JSON(http.StatusBadRequest,gin.H{"error":"invalid id "})
		return
	}


	type newUpdate struct {
    	File string
		Comment string
	}

	db.Model(&entity.Progress{}).Where("id = ?", uint(pro_id)).

	Updates(newUpdate{
		File: newfile,
        Comment:  newcomment,
	})
	log.InsertLog(c,6)
	c.JSON(http.StatusOK,"update ok")
}

func DeleteProgress(c * gin.Context) {
	db := database.DB()

	var id_str = c.Query("id")
	id_int,_ := strconv.ParseInt(id_str,10,64)

	var group_progress [] entity.Progress
	result := db.Where("id = ?", id_int).Find(&group_progress)
	if result.RowsAffected == 0{
		c.JSON(http.StatusBadRequest,gin.H{"error":"invalid id "})
		return
	}

	db.Delete(&entity.Progress{}, id_int)
	log.InsertLog(c,7)
	c.JSON(http.StatusOK,"suscessfully delete")

}
