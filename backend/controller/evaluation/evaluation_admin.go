package evaluation

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team07/backend/controller/log"
	"github.com/sut68/team07/backend/database"
	"github.com/sut68/team07/backend/entity"
	"github.com/sut68/team07/backend/middleware"
	"gorm.io/gorm"
)

func ListCriteria(c *gin.Context) {
	var evaluations []entity.Evaluation
	db := database.DB()

	if err := db.Preload("Criteria").Find(&evaluations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := []gin.H{}
	for _, eva := range evaluations {
		response = append(response, gin.H{
			"id":             eva.ID,
			"name":           eva.Name,
			"total_score":    eva.TotalScore,
			"for_group_only": eva.ForGroupOnly,
			"criteria_count": len(eva.Criteria),
		})
	}

	c.JSON(http.StatusOK, response)
}

func GetCriteria(c *gin.Context) {
	id := c.Param("id")
	var eva entity.Evaluation
	db := database.DB()
	if err := db.Preload("Criteria", func(db *gorm.DB) *gorm.DB {
		return db.Order("criteria.order ASC").Preload("CriteriaLevel")
	}).First(&eva, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Evaluation form not found"})
		return
	}

	criteriaList := []gin.H{}
	for _, cri := range eva.Criteria {
		levels := []gin.H{}
		for _, lvl := range cri.CriteriaLevel {
			levels = append(levels, gin.H{
				"id":          lvl.ID,
				"description": lvl.Description,
				"score":       lvl.Score,
			})
		}

		criteriaList = append(criteriaList, gin.H{
			"id":        cri.ID,
			"name":      cri.Name,
			"max_score": cri.MaxScore,
			"order":     cri.Order,
			"levels":    levels,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"id":             eva.ID,
		"name":           eva.Name,
		"total_score":    eva.TotalScore,
		"for_group_only": eva.ForGroupOnly,
		"criteria":       criteriaList,
	})
}

func CreateCriteria(c *gin.Context) {
	var criteria entity.Criteria
	if err := c.ShouldBindJSON(&criteria); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := middleware.GetClaimsFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := database.DB()
	var evaluation entity.Evaluation
	if err := db.First(&evaluation, criteria.EvaluationID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Evaluation category not found"})
		return
	}

	var currentSum float64
	db.Model(&entity.Criteria{}).
		Where("evaluation_id = ?", criteria.EvaluationID).
		Select("COALESCE(SUM(max_score), 0)").
		Scan(&currentSum)

	if currentSum+criteria.MaxScore > evaluation.TotalScore {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":     "Total score exceeds the limit!",
			"limit":     evaluation.TotalScore,
			"current":   currentSum,
			"remaining": evaluation.TotalScore - currentSum,
		})
		return
	}
	if err := db.Create(&criteria).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.InsertLog(c, 21)
	c.JSON(http.StatusCreated, gin.H{"data": criteria, "message": "Criteria created successfully"})
}

func UpdateCriteria(c *gin.Context) {
	id := c.Param("id")
	var payload entity.Criteria
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.DB()
	var existing entity.Criteria
	if err := db.First(&existing, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Criteria not found"})
		return
	}

	if payload.MaxScore != 0 && payload.MaxScore != existing.MaxScore {
		var evaluation entity.Evaluation
		db.First(&evaluation, existing.EvaluationID)

		var currentSum float64
		db.Model(&entity.Criteria{}).
			Where("evaluation_id = ? AND id != ?", existing.EvaluationID, id).
			Select("COALESCE(SUM(max_score), 0)").
			Scan(&currentSum)

		if currentSum+payload.MaxScore > evaluation.TotalScore {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":          "Total score exceeds the limit!",
				"limit":          evaluation.TotalScore,
				"current_others": currentSum,
				"can_add_max":    evaluation.TotalScore - currentSum,
			})
			return
		}
	}

	if err := db.Model(&existing).Updates(payload).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.InsertLog(c, 23)
	c.JSON(http.StatusOK, gin.H{"data": existing, "message": "Criteria updated successfully"})
}

func DeleteCriteria(c *gin.Context) {
	id := c.Param("id")
	db := database.DB()

	var criteria entity.Criteria
	if err := db.Preload("Evaluation").First(&criteria, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Criteria not found"})
		return
	}


	if err := db.Delete(&criteria).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.InsertLog(c, 22)
	c.JSON(http.StatusOK, gin.H{"message": "Criteria deleted successfully"})
}

func CreateCriteriaLevel(c *gin.Context) {
	var level entity.CriteriaLevel
	if err := c.ShouldBindJSON(&level); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.DB()

	var parentCriteria entity.Criteria
	if err := db.First(&parentCriteria, level.CriteriaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Parent criteria not found"})
		return
	}

	if level.Score > parentCriteria.MaxScore {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":     "Level score cannot be higher than criteria max score",
			"max_score": parentCriteria.MaxScore,
		})
		return
	}

	if err := db.Create(&level).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.InsertLog(c, 24)
	c.JSON(http.StatusCreated, gin.H{"data": level, "message": "Level added successfully"})
}

func UpdateCriteriaLevel(c *gin.Context) {
	id := c.Param("id")
	var payload entity.CriteriaLevel
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.DB()
	var existing entity.CriteriaLevel
	if err := db.First(&existing, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Level not found"})
		return
	}

	if payload.Score != 0 {
		var parentCriteria entity.Criteria
		db.First(&parentCriteria, existing.CriteriaID)
		if payload.Score > parentCriteria.MaxScore {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Score exceeds criteria limit"})
			return
		}
	}

	if err := db.Model(&existing).Updates(payload).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.InsertLog(c, 26)
	c.JSON(http.StatusOK, gin.H{"data": existing, "message": "Level updated successfully"})
}

func DeleteCriteriaLevel(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB().Delete(&entity.CriteriaLevel{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	log.InsertLog(c, 25)
	c.JSON(http.StatusOK, gin.H{"message": "Level deleted successfully"})
}
