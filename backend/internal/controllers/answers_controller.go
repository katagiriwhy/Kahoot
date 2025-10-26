package controllers

import (
	"backend/backend/internal/types"
	"net/http"
	"strconv"

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
