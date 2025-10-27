package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"net/http"
	"strconv"
)

type SessionPlayersController struct {
	db *pgxpool.Pool
}

func NewSessionPlayersController(db *pgxpool.Pool) *SessionPlayersController {
	return &SessionPlayersController{
		db: db,
	}
}

type PlayersResponse struct {
	Nickname string `json:"nickname"`
}

func (s *SessionPlayersController) Get(c *gin.Context) {

	idStr := c.Param("id")
	sessionId, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var players []PlayersResponse

	const query = `SELECT user_id, nickname FROM session_players WHERE session_id = $1`

	rows, err := s.db.Query(c.Request.Context(), query, sessionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	defer rows.Close()

	for rows.Next() {
		var player PlayersResponse

		if err := rows.Scan(&player.UserID, &player.Nickname); err != nil {
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
