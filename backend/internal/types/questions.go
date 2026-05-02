package types

type Question struct {
	ID           int64  `json:"id" db:"id"`
	QuizID       int64  `json:"quiz_id" db:"quiz_id"`
	QuestionText string `json:"question_text" db:"question_text"`
	Points       int    `json:"points" db:"points"`
}
