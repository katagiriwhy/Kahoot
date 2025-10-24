package controllers

import (
	"backend/backend/internal/types"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type QuizRequest struct {
	IsPublic       bool                 `json:"is_public" binding:"required"`
	CreatorId      int                  `json:"creator_id" binding:"required"`
	Difficulty     types.QuizDifficulty `json:"quiz_difficulty" binding:"required"`
	QuestionAmount int                  `json:"question_amount" binding:"required"`
	Title          string               `json:"title" binding:"required"`
	TimeLimit      int                  `json:"time_limit"`
	Description    string               `json:"description"`
}

type QuizController struct {
	db *pgxpool.Pool
}

func NewQuizController(db *pgxpool.Pool) *QuizController {
	return &QuizController{
		db: db,
	}
}

func (q *QuizController) CreateQuiz(c *gin.Context) {
	var body QuizRequest

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusNotAcceptable, gin.H{"error": fmt.Sprintf("can't get correct data %s", err)})
		return
	}

	if ok := body.Difficulty.IsValid(); !ok {
		c.JSON(http.StatusNotAcceptable, gin.H{"error": "difficulty is not valid"})
		return
	}

	if body.QuestionAmount == 0 {
		c.JSON(http.StatusNotAcceptable, gin.H{"error": "question amount is zero"})
		return
	}

	if body.TimeLimit <= 0 {
		c.JSON(http.StatusNotAcceptable, gin.H{"error": "time_limit is not valid"})
		return
	}

	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusNotAcceptable, gin.H{"error": fmt.Sprintf("can't get file %s", err)})
		return
	}

	const query = `INSERT INTO quizzes ()`

}
