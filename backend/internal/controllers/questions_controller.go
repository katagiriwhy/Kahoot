package controllers

import (
	"backend/backend/internal/types"
	"net/http"
	"strconv"
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

type QuestionResponse struct {
	ID           int    `json:"id"`
	QuestionText string `json:"question_text"`
	Points       int    `json:"points"`
}

type Answer struct {
	AnswerText string `json:"answer_text" binding:"required"`
	IsCorrect  bool   `json:"is_correct"`
}

type QuestionsWithAnswers struct {
	QuizID       int64    `json:"quiz_id" binding:"required" db:"quiz_id"`
	QuestionText string   `json:"question_text" binding:"required" db:"question_text"`
	Points       int      `json:"points" binding:"required" db:"points"`
	Answers      []Answer `json:"answers" binding:"required"`
}

func (q *QuestionsController) Get(c *gin.Context) {
	quizID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	const query = `SELECT id, question_text, points FROM questions WHERE quiz_id = $1`

	var questions []QuestionResponse

	rows, err := q.db.Query(c.Request.Context(), query, quizID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	defer rows.Close()

	for rows.Next() {
		var question QuestionResponse
		err = rows.Scan(&question.ID, &question.QuestionText, &question.Points)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		questions = append(questions, question)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(questions) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "no questions found"})
		return
	}

	c.JSON(http.StatusOK, questions)
}

func (q *QuestionsController) CreateWithAnswer(c *gin.Context) {
	var questions QuestionsWithAnswers

	if err := c.ShouldBindJSON(&questions); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()

	tx, err := q.db.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	committed := false

	defer func() {
		if !committed {
			_ = tx.Rollback(ctx)
		}
	}()

	var exists bool
	err = q.db.QueryRow(c.Request.Context(), "SELECT EXISTS(SELECT 1 FROM quizzes WHERE id=$1)", questions.QuizID).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db check failed"})
		return
	}

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "quiz with this id does not exist"})
		return
	}

	if questions.Points <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "points must be greater than zero"})
		return
	}

	if strings.TrimSpace(questions.QuestionText) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "question text must not be empty"})
		return
	}

	const query = `INSERT INTO questions (quiz_id, question_text, points) VALUES ($1, $2, $3) RETURNING id`

	var questionId int

	err = q.db.QueryRow(c.Request.Context(), query, questions.QuizID, questions.QuestionText, questions.Points).Scan(&questionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, a := range questions.Answers {
		if strings.TrimSpace(a.AnswerText) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "answer text must not be empty"})
			return
		}

		_, err = q.db.Exec(ctx,
			`INSERT INTO answers (question_id, answer_text, is_correct) 
			VALUES ($1, $2, $3)`,
			questionId, a.AnswerText, a.IsCorrect)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	committed = true

	c.JSON(http.StatusCreated, gin.H{"question_id": questionId})
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
