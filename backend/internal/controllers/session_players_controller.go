package controllers

import (
	"net/http"
	"strconv"

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
		c.JSON(404, gin.H{"error": "session not found"})
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
