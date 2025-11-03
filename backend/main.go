package main

import (
	
	"github.com/sut68/team07/backend/database"
	"github.com/gin-gonic/gin"
)

func main() {
	
	database.CheckGetENV()
	database.ConnectDatabase()
	database.SetUpDatabase()
	r := gin.Default()
	r.Use(database.CORSMiddleware())

	r.Run(":8080")
}

