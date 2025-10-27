package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"net/http"
)

type GameSessionController struct {
	db *pgxpool.Pool
}

type CreateGameSessionRequest struct {
	QuizID int64 `json:"quiz_id" binding:"required"`
}

func NewGameSessionController(db *pgxpool.Pool) *GameSessionController {
	return &GameSessionController{
		db: db,
	}
}

func (g *GameSessionController) Create(c *gin.Context) {
	userID, exists := c.Get("user_id")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unable to get user_id while creating a new game session"})
		return
	}

	hostId, ok := userID.(int64)

	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "wrong type for user_id"})
		return
	}

	var input CreateGameSessionRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.QuizID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "quiz_id must be positive"})
		return
	}

	var isPublic, quizExists bool
	var creatorID int64

	const quizQuery = `
    SELECT 
        EXISTS(SELECT 1 FROM quizzes WHERE id = $1),
        is_public, 
        creator_id 
    FROM quizzes 
    WHERE id = $1`

	err := g.db.QueryRow(c.Request.Context(), quizQuery, input.QuizID).
		Scan(&quizExists, &isPublic, &creatorID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}
	if !quizExists {
		c.JSON(http.StatusNotFound, gin.H{"error": "quiz not found"})
		return
	}

	if !isPublic && creatorID != hostId {
		c.JSON(http.StatusBadRequest, gin.H{"error": "quiz is not public or host id doesn't equals creatorId"})
		return
	}

	const query = `INSERT INTO game_sessions (host_id, quiz_id) VALUES ($1, $2) RETURNING id`

	var gameSessionId int64

	err = g.db.QueryRow(c.Request.Context(), query, userID, input.QuizID).Scan(&gameSessionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"game_session_id": gameSessionId})
}
