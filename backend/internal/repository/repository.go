package repository

import "github.com/jackc/pgx/v5/pgxpool"

type Entity interface {
	GetTable() string
	GetFields() map[string]interface{}
}

type Repository struct {
	db *pgxpool.Pool
}
