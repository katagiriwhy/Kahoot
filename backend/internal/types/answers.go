package types

type Answers struct {
	ID         int64  `json:"id"`
	QuestionID int64  `json:"question_id"`
	AnswerText string `json:"answer_text"`
	IsCorrect  bool   `json:"is_correct"`
}
