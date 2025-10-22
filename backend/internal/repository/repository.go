package repository

import "github.com/jackc/pgx/v5/pgxpool"

type Entity interface {
	GetTableName() string
	GetFields() map[string]interface{}
}

type Repository[T Entity] struct {
	db *pgxpool.Pool
}
