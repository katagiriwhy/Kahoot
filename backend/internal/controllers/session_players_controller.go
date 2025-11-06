package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SessionPlayersController struct {
	db *pgxpool.Pool
}

func NewSessionPlayersController(db *pgxpool.Pool) *SessionPlayersController {
	return &SessionPlayersController{
		db: db,
	}
}

type Player struct {
	Nickname string `json:"nickname"`
}

func (s *SessionPlayersController) Get(c *gin.Context) {

	id, received := c.Get("user_id")
	if !received {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID, ok := id.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user_id"})
		return
	}

	idStr := c.Param("id")
	sessionId, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var exists bool
	err = s.db.QueryRow(c.Request.Context(),
		`SELECT EXISTS(SELECT 1 FROM game_sessions WHERE id = $1)`, sessionId,
	).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !exists {
		c.JSON(404, gin.H{"error": "session was not found"})
		return
	}

	var allowed bool
	err = s.db.QueryRow(c.Request.Context(),
		`SELECT EXISTS(
            SELECT 1 FROM game_sessions WHERE id = $1 AND host_id = $2
            UNION ALL
            SELECT 1 FROM session_players WHERE session_id = $1 AND user_id = $2
        )`, sessionId, userID,
	).Scan(&allowed)
	if err != nil {
		c.JSON(500, gin.H{"error": "db error"})
		return
	}
	if !allowed {
		c.JSON(403, gin.H{"error": "access denied"})
		return
	}

	var players []Player

	const query = `SELECT nickname FROM session_players WHERE session_id = $1 ORDER BY joined_at`

	rows, err := s.db.Query(c.Request.Context(), query, sessionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	defer rows.Close()

	for rows.Next() {
		var player Player

		if err := rows.Scan(&player.Nickname); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		players = append(players, player)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"players": players})
}

func (s *SessionPlayersController) Delete(c *gin.Context) {
	id, received := c.Get("user_id")
	if !received {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, ok := id.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user_id"})
		return
	}

	sessionIDStr := c.Param("id")
	sessionID, err := strconv.ParseInt(sessionIDStr, 10, 64)
	if err != nil || sessionID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	var startedAt *time.Time
	err = s.db.QueryRow(c.Request.Context(),
		`SELECT started_at FROM game_sessions WHERE id = $1`, sessionID,
	).Scan(&startedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if startedAt != nil {
		c.JSON(400, gin.H{"error": "session started_at cannot be set"})
		return
	}

	var inSession bool
	err = s.db.QueryRow(c.Request.Context(),
		`SELECT EXISTS(SELECT 1 FROM session_players WHERE session_id = $1 AND user_id = $2)`,
		sessionID, userID,
	).Scan(&inSession)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	if !inSession {
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not in this session"})
		return
	}

	const query = `DELETE FROM session_players WHERE session_id = $1 AND user_id = $2`

	rows, err := s.db.Exec(c.Request.Context(), query, sessionID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if affected := rows.RowsAffected(); affected != 1 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "affected rows not match"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted",
		"session_id": sessionID})
}
