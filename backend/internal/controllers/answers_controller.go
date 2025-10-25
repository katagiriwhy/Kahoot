package controllers

import "github.com/jackc/pgx/v5/pgxpool"

type AnswersController struct {
	db *pgxpool.Pool
}

func NewAnswersController(db *pgxpool.Pool) *AnswersController {
	return &AnswersController{
		db: db,
	}
}
