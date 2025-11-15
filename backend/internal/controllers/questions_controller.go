package controllers

import (
	"backend/backend/internal/types"
	"encoding/json"
	"io"
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
	Image        []byte   `json:"image" db:"image"`
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

	quizIdStr := c.PostForm("quiz_id")

	quizId, err := strconv.Atoi(quizIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	questionText := c.PostForm("question_text")

	pointsStr := c.PostForm("points")

	points, err := strconv.Atoi(pointsStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	answersStr := c.PostForm("answers")
	if answersStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "answer is required"})
		return
	}

	var answers []Answer

	if err := json.Unmarshal([]byte(answersStr), &answers); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
	err = q.db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM quizzes WHERE id=$1)", quizId).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db check failed"})
		return
	}

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "quiz with this id does not exist"})
		return
	}

	if points <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "points must be greater than zero"})
		return
	}

	if strings.TrimSpace(questionText) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "question text must not be empty"})
		return
	}

	const query = `INSERT INTO questions (quiz_id, question_text, points, image) VALUES ($1, $2, $3, $4) RETURNING id`

	var questionId int

	err = q.db.QueryRow(ctx, query, quizId, questionText, points, imageData).Scan(&questionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, a := range answers {
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

func (q *QuestionsController) GetImage(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	const query = `SELECT image FROM questions WHERE id=$1`

	var imageData []byte

	err = q.db.QueryRow(c.Request.Context(), query, id).Scan(&imageData)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "quiz not found"})
		return
	}

	if len(imageData) == 0 {
		c.Status(http.StatusNoContent)
		return
	}

	contentType := http.DetectContentType(imageData)
	c.Data(http.StatusOK, contentType, imageData)
}
