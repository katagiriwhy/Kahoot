package controllers

import (
	"backend/backend/internal/types"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AnswersController struct {
	db *pgxpool.Pool
}

func NewAnswersController(db *pgxpool.Pool) *AnswersController {
	return &AnswersController{
		db: db,
	}
}

func (a *AnswersController) Get(c *gin.Context) {
	questionID := c.Param("id")

	id, err := strconv.ParseInt(questionID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	const query = `SELECT * FROM answers WHERE question_id = $1`

	rows, err := a.db.Query(c.Request.Context(), query, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	defer rows.Close()

	var answers []types.Answers
	for rows.Next() {
		var answer types.Answers

		err := rows.Scan(&answer.ID,
			&answer.QuestionID,
			&answer.AnswerText,
			&answer.IsCorrect,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		answers = append(answers, answer)
	}

	if len(answers) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "answers are not found"})
		return
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"answers": answers})
}

func (a *AnswersController) Create(c *gin.Context) {
	questionIDStr := c.Param("id")

	if strings.TrimSpace(questionIDStr) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "question id is required"})
		return
	}

	questionID, err := strconv.ParseInt(questionIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var input struct {
		AnswerText string `json:"answer_text" binding:"required"`
		IsCorrect  bool   `json:"is_correct"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if strings.TrimSpace(input.AnswerText) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "answer_text cannot be empty"})
		return
	}

	var exists bool
	err = a.db.QueryRow(c.Request.Context(),
		`SELECT EXISTS(SELECT 1 FROM questions WHERE id = $1)`, questionID,
	).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
		return
	}

	if input.IsCorrect {
		var hasCorrect bool
		err = a.db.QueryRow(c.Request.Context(),
			`SELECT EXISTS(SELECT 1 FROM answers WHERE question_id = $1 AND is_correct = true)`, questionID,
		).Scan(&hasCorrect)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}
		if hasCorrect {
			c.JSON(http.StatusBadRequest, gin.H{"error": "question already has a correct answer"})
			return
		}
	}

	const query = `INSERT INTO answers (question_id, answer_text, is_correct) VALUES ($1, $2, $3) RETURNING id`

	var id int64

	err = a.db.QueryRow(c.Request.Context(), query, questionID, input.AnswerText, input.IsCorrect).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"answer_id": id})
}
