package types

import "time"

type QuizDifficulty string

const (
	Easy    QuizDifficulty = "Легкий"
	Average QuizDifficulty = "Средний"
	Hard    QuizDifficulty = "Сложный"
)

func (qd QuizDifficulty) IsValid() bool {
	switch qd {
	case Easy, Average, Hard:
		return true
	}
	return false
}

type Quiz struct {
	ID             int            `json:"id" db:"id"`
	IsPublic       bool           `json:"is_public" db:"is_public"`
	CreatorID      int            `json:"creator_id" db:"creator_id"`
	QuestionAmount int            `json:"question_amount" db:"question_amount"`
	Description    string         `json:"description" db:"description"`
	TimeLimit      int            `json:"time_limit" db:"time_limit"`
	QuizDiff       QuizDifficulty `json:"difficulty" db:"difficulty"`
	Title          string         `json:"title" db:"title"`
	ImageData      []byte         `json:"image_data,omitempty" db:"image_data"`
	CreatedAt      time.Time      `json:"created_at" db:"created_at"`
}
