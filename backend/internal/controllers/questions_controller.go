package controllers

import (
	"backend/backend/internal/types"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type QuestionsController struct {
	db *pgxpool.Pool
}

func NewQuestionsController(db *pgxpool.Pool) *QuestionsController {
	return &QuestionsController{
		db: db,
	}
}

func (q *QuestionsController) Create(c *gin.Context) {
	var question types.Question

	if err := c.ShouldBindJSON(&question); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var exists bool
	err := q.db.QueryRow(c.Request.Context(), "SELECT EXISTS(SELECT 1 FROM quizzes WHERE id=$1)", question.QuizID).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db check failed"})
		return
	}

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "quiz with this id does not exist"})
		return
	}

	if question.Points <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "points must be greater than zero"})
		return
	}

	if strings.TrimSpace(question.QuestionText) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "question text must not be empty"})
		return
	}

	const query = `INSERT INTO questions (quiz_id, question_text, points) VALUES ($1, $2, $3) RETURNING id`

	var id int

	err = q.db.QueryRow(c.Request.Context(), query, question.QuizID, question.QuestionText, question.Points).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id})
}
