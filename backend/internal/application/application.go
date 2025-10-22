package application

import "backend/backend/internal/controllers"

type Application struct {
	UserController *controllers.UserController
}

func NewApplication() *Application {
	return &Application{}
}
