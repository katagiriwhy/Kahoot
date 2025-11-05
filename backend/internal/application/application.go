package application

import (
	"backend/backend/internal/controllers"
	"backend/backend/internal/database"
	"backend/backend/internal/routes"
	"backend/backend/internal/ws"
	"context"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Application struct {
	db          *database.Storage
	controllers *controllers.Controllers
	router      *gin.Engine
	hub         *ws.Hub
}

func NewApplication() *Application {
	db, err := database.NewStorage()

	pool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))

	controls := initControllers(pool)

	if err != nil {
		panic(err)
	}

	engine := routes.NewRoutes(controls)

	hub := ws.NewHub(pool)

	return &Application{
		db:     db,
		router: engine,
		hub:    hub,
	}
}

func (a *Application) Run() {

	go a.hub.Run()

	a.router.Run(os.Getenv("PORT"))
	if a.db != nil {
		a.db.Close()
	}
}

func initControllers(p *pgxpool.Pool) *controllers.Controllers {

	userCon := controllers.NewUserController(p)
	quizCon := controllers.NewQuizController(p)
	questionCon := controllers.NewQuestionsController(p)
	answerCon := controllers.NewAnswersController(p)
	gameSessionCon := controllers.NewGameSessionController(p)
	sessionPlayersCon := controllers.NewSessionPlayersController(p)

	return &controllers.Controllers{
		UserController:           userCon,
		QuizController:           quizCon,
		QuestionController:       questionCon,
		AnswerController:         answerCon,
		GameSessionController:    gameSessionCon,
		SessionPlayersController: sessionPlayersCon,
	}
}
