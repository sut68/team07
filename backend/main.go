package main

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller.go/issues"
	"github.com/sut68/team07/backend/controller.go/users"
	"github.com/sut68/team07/backend/database"
	mockdata "github.com/sut68/team07/backend/mockData"
)

func main() {

	database.CheckGetENV()
	database.ConnectDatabase()
	database.SetUpDatabase()
	//============== Insert Data ===============
	Data := database.DB()
	mockdata.InsertMock(Data)
	//=================================
	r := gin.Default()
	r.Use(database.CORSMiddleware())
	r.GET("/getGender", users.GetGender)
	r.GET("/getIssueStatus", issues.GetIssueStatus)
	r.Run(":8080")
}
