package controllers

import (
	"backend/backend/internal/utils"
	"backend/backend/internal/ws"
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type GameSessionController struct {
	db  *pgxpool.Pool
	hub *ws.Hub
}

type CreateGameSessionRequest struct {
	QuizID int64 `json:"quiz_id" binding:"required"`
}

func NewGameSessionController(db *pgxpool.Pool, hub *ws.Hub) *GameSessionController {
	return &GameSessionController{
		db:  db,
		hub: hub,
	}
}

func (g *GameSessionController) Create(c *gin.Context) {
	userID, ok := getUserId(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
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

	if !isPublic && creatorID != userID {
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

func (g *GameSessionController) Join(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing token"})
		return
	}
	userID, err := utils.ValidateToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	conn, err := ws.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		// TODO log the error
		return
	}

	type JoinMsg struct {
		Type      string `json:"type"`
		SessionID int64  `json:"session_id"`
	}
	var msg JoinMsg
	if err := conn.ReadJSON(&msg); err != nil {
		conn.WriteJSON(gin.H{"error": "invalid join message"})
		return
	}
	if msg.Type != "join" || msg.SessionID <= 0 {
		conn.WriteJSON(gin.H{"error": "invalid join data"})
		return
	}
	sessionId := msg.SessionID

	const query = `SELECT started_at, host_id FROM game_sessions WHERE id = $1`

	var startedAt *time.Time
	var hostId int64

	err = g.db.QueryRow(c.Request.Context(), query, sessionId).Scan(&startedAt, &hostId)
	if errors.Is(err, sql.ErrNoRows) {
		conn.WriteJSON(gin.H{"error": "invalid db request"})
		return
	}

	if err != nil {
		conn.WriteJSON(gin.H{"error": "database error"})
		return
	}

	if hostId == userID {
		conn.WriteJSON(gin.H{"status": "joined_as_host"})
		client := ws.NewClient(conn, sessionId, userID)
		g.hub.Register <- client
		go client.WritePump()
		client.ReadPump(g.hub)
		return
	}

	if startedAt != nil {
		conn.WriteJSON(gin.H{"error": "session already started"})
		return
	}

	var nickname string

	err = g.db.QueryRow(c.Request.Context(), `SELECT username FROM users WHERE id = $1`, userID).Scan(&nickname)
	if err != nil {
		conn.WriteJSON(gin.H{"error": err.Error()})
		return
	}

	const sessionQuery = `INSERT INTO session_players (session_id, user_id, nickname) VALUES ($1, $2, $3) ON CONFLICT (session_id, user_id) DO NOTHING`

	_, err = g.db.Exec(c.Request.Context(), sessionQuery, sessionId, userID, nickname)

	if err != nil {
		conn.WriteJSON(gin.H{"error": err.Error()})
		return
	}

	conn.WriteJSON(gin.H{"status": "joined"})
	client := ws.NewClient(conn, sessionId, userID)
	g.hub.Register <- client
	go client.WritePump()
	client.ReadPump(g.hub)

}

func getUserId(c *gin.Context) (int64, bool) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}
	userId, ok := userIDStr.(int64)
	if !ok {
		return 0, false
	}

	return userId, true
}

func (g *GameSessionController) Start(c *gin.Context) {

	userId, ok := getUserId(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unable to get user_id while starting a new session"})
		return
	}

	var input struct {
		SessionId int64 `json:"session_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.SessionId <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id must be positive"})
		return
	}

	var hostID int64
	var startedAt *time.Time

	err := g.db.QueryRow(c.Request.Context(),
		`SELECT host_id, started_at  FROM game_sessions WHERE id = $1`, input.SessionId,
	).Scan(&hostID, &startedAt)

	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(404, gin.H{"error": "session not found"})
		return
	}
	if err != nil {
		c.JSON(500, gin.H{"error": "db error"})
		return
	}
	if hostID != userId {
		c.JSON(403, gin.H{"error": "only host can start the game"})
		return
	}
	if startedAt != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "session already started"})
		return
	}

	var amountPlayers int64

	err = g.db.QueryRow(c.Request.Context(), `SELECT COUNT(*) FROM session_players WHERE session_id = $1`, input.SessionId).Scan(&amountPlayers)
	if err != nil {
		c.JSON(500, gin.H{"error": "db error"})
		return
	}
	if amountPlayers == 0 {
		c.JSON(403, gin.H{"error": "no players to start the game"})
		return
	}

	const query = `UPDATE game_sessions SET started_at = NOW() WHERE id = $1 AND started_at IS NULL`

	rows, err := g.db.Exec(c.Request.Context(), query, input.SessionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	affected := rows.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"started": true})
}

func (g *GameSessionController) End(c *gin.Context) {
	userId, ok := getUserId(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unable to get user_id while ending session"})
		return
	}

	var input struct {
		SessionId int64 `json:"session_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.SessionId <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id must be positive"})
		return
	}
	var hostID int64
	var endedAt *time.Time
	err := g.db.QueryRow(c.Request.Context(),
		`SELECT host_id, ended_at FROM game_sessions WHERE id = $1`, input.SessionId,
	).Scan(&hostID, &endedAt)

	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(404, gin.H{"error": "session not found"})
		return
	}
	if err != nil {
		c.JSON(500, gin.H{"error": "db error"})
		return
	}
	if hostID != userId {
		c.JSON(403, gin.H{"error": "only host can end the game"})
		return
	}
	if endedAt != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session already ended"})
		return
	}

	const query = `UPDATE game_sessions SET ended_at = NOW() WHERE id = $1 AND ended_at IS NULL`

	res, err := g.db.Exec(c.Request.Context(), query, input.SessionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	affected := res.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ended": true})
}

func (g *GameSessionController) Delete(c *gin.Context) {
	sessionIDStr := c.Param("id")
	if sessionIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id required"})
		return
	}

	sessionID, err := strconv.ParseInt(sessionIDStr, 10, 64)
	if err != nil || sessionID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	userID, ok := getUserId(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unable to get user_id while deleting a session"})
		return
	}

	var hostID int64
	var startedAt *time.Time

	err = g.db.QueryRow(c.Request.Context(),
		`SELECT host_id, started_at FROM game_sessions WHERE id = $1`,
		sessionID).Scan(&hostID, &startedAt)

	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}

	if hostID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "only host can delete the session"})
		return
	}

	if startedAt != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session already deleted"})
		return
	}

	const query = `DELETE FROM game_sessions WHERE id = $1`

	res, err := g.db.Exec(c.Request.Context(), query, sessionID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if affected := res.RowsAffected(); affected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "session hasn't been deleted"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"deleted": true,
		"session_id": sessionID})
}
