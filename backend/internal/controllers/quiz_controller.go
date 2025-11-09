package controllers

import (
	"backend/backend/internal/types"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type QuizResponse struct {
	ID             int64                `json:"id"`
	IsPublic       bool                 `json:"is_public"`
	CreatorID      int64                `json:"creator_id"`
	Difficulty     types.QuizDifficulty `json:"difficulty"`
	QuestionAmount int                  `json:"question_amount"`
	Title          string               `json:"title"`
	TimeLimit      int                  `json:"time_limit"`
	Description    string               `json:"description"`
	CreatedAt      *time.Time           `json:"created_at"`
	ImageURL       string               `json:"image_url"`
}

type QuizController struct {
	db *pgxpool.Pool
}

func NewQuizController(db *pgxpool.Pool) *QuizController {
	return &QuizController{
		db: db,
	}
}

func (q *QuizController) GetQuizImage(c *gin.Context) {
	id := c.Param("id")

	quizId, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	const query = `SELECT image FROM quizzes WHERE quiz_id = $1`

	var imageData []byte

	err = q.db.QueryRow(c, query, quizId).Scan(&imageData)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "quiz not found"})
		return
	}

	// TODO check if there is no image

	//if len(imageData) == 0 {
	//	c.JSON(http.StatusNotFound, gin.H{"error": "image is not found"})
	//	return
	//}

	contentType := http.DetectContentType(imageData)
	c.Data(http.StatusOK, contentType, imageData)

}

func (q *QuizController) GetQuizzes(c *gin.Context) {
	const query = `
		SELECT
			id,
			is_public,
			creator_id,
			difficulty,
			question_amount,
			title,
			time_limit,
			description,
			created_at
		FROM quizzes
		ORDER BY created_at DESC;
	`
	rows, err := q.db.Query(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	defer rows.Close()

	var quizzes []QuizResponse

	for rows.Next() {
		var qz QuizResponse
		err := rows.Scan(
			&qz.ID,
			&qz.IsPublic,
			&qz.CreatorID,
			&qz.Difficulty,
			&qz.QuestionAmount,
			&qz.Title,
			&qz.TimeLimit,
			&qz.Description,
			&qz.CreatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("row scan error: %v", err)})
			return
		}

		qz.ImageURL = fmt.Sprintf("/quizzes/%d/image", qz.ID)

		quizzes = append(quizzes, qz)
	}

	if len(quizzes) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "quizzes not found"})
		return
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, quizzes)
}

func (q *QuizController) Create(c *gin.Context) {

	isPublic := c.PostForm("is_public") == "true"
	creatorId := c.PostForm("creator_id")
	difficulty := types.QuizDifficulty(c.PostForm("difficulty"))
	questionAmount := c.PostForm("question_amount")
	title := c.PostForm("title")
	timeLimit := c.PostForm("time_limit")
	description := c.PostForm("description")

	if ok := difficulty.IsValid(); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid difficulty"})
		return
	}

	var imageData []byte

	file, err := c.FormFile("image")
	if err == nil {
		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "can't open file"})
			return
		}
		defer src.Close()
		imageData, err = io.ReadAll(src)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "can't read image"})
			return
		}
	}

	//file, err := c.FormFile("image")
	//if err != nil {
	//	c.JSON(http.StatusBadRequest, gin.H{"error": "image file is required"})
	//	return
	//}
	//
	//src, err := file.Open()
	//if err != nil {
	//	c.JSON(http.StatusInternalServerError, gin.H{"error": "can't open file"})
	//	return
	//}
	//defer src.Close()
	//
	//imageData, err := io.ReadAll(src)
	//if err != nil {
	//	c.JSON(http.StatusInternalServerError, gin.H{"error": "can't read image"})
	//	return
	//}

	creatorIdInt, err := strconv.Atoi(creatorId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid creator_id"})
		return
	}
	questionAmountInt, err := strconv.Atoi(questionAmount)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid question_amount"})
		return
	}
	timeLimitInt, err := strconv.Atoi(timeLimit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid time_limit"})
		return
	}

	const query = `
		INSERT INTO quizzes (
			is_public, creator_id, image, difficulty, question_amount,
			title, time_limit, description
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id;
	`

	var quizID int64
	err = q.db.QueryRow(
		c, query,
		isPublic,
		creatorIdInt,
		imageData,
		difficulty,
		questionAmountInt,
		title,
		timeLimitInt,
		description,
	).Scan(&quizID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("db insert error: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "quiz created successfully",
		"quiz_id": quizID,
	})
}
