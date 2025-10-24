package controllers

import (
	"backend/backend/internal/types"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

const MaxSizeImage = 5 * 1024 * 1024

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

	defer file.Close()

	if header.Size > MaxSizeImage {
		c.JSON(http.StatusNotAcceptable, gin.H{"error": "image size is too big"})
		return
	}

	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
	}

	if !allowedTypes[header.Header.Get("Content-Type")] {
		c.JSON(http.StatusNotAcceptable, gin.H{"error": "invalid image type"})
		return
	}

	src, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusNotAcceptable, gin.H{"error": fmt.Sprintf("can't read file %s", err)})
		return
	}

	const query = `
    INSERT INTO quizzes (
      is_public, creator_id, image_data, difficulty, question_amount,
      title, time_limit, description
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id;
  `

	var questoinId int
	err = q.db.QueryRow(c, query, body.IsPublic, body.CreatorId, src, body.Difficulty, body.QuestionAmount,
		body.Title, body.TimeLimit, body.Description).Scan(&questoinId)

	if err != nil {
		c.JSON(http.StatusNotAcceptable, gin.H{"error": fmt.Sprintf("can't insert quizzes %s", err)})
		return
	}

}
