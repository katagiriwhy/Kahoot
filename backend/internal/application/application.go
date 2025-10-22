package application

import (
	"backend/backend/internal/controllers"
	"backend/backend/internal/database"
	"github.com/gin-gonic/gin"
	"os"
)

type Application struct {
	db             *database.Storage
	UserController *controllers.UserController
	router         *gin.Engine
}

func NewApplication() *Application {
	db, err := database.NewStorage()

	if err != nil {
		panic(err)
	}

	return &Application{
		db: db,
	}
}

func (a *Application) Run() {

	a.router.Run(os.Getenv("PORT"))
	if a.db != nil {
		a.db.Close()
	}
}
