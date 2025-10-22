package database

import (
	"context"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Storage struct {
	db *pgxpool.Pool
}

func (s *Storage) Close() {
	s.db.Close()
}

func NewStorage() (*Storage, error) {
	pool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))

	if err != nil {
		return nil, err
	}

	if err := pool.Ping(context.Background()); err != nil {
		return nil, err
	}

	return &Storage{pool}, nil
}
