package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type GameSessionController struct {
	db *pgxpool.Pool
}

func NewGameSessionController(db *pgxpool.Pool) *GameSessionController {
	return &GameSessionController{
		db: db,
	}
}

func (g *GameSessionController) Create(c *gin.Context) {

}
