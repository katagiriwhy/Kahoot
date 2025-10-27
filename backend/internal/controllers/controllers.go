package controllers

type Controllers struct {
	UserController        *UserController
	QuizController        *QuizController
	QuestionController    *QuestionsController
	AnswerController      *AnswersController
	GameSessionController *GameSessionController
}
