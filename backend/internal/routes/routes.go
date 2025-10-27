package routes

import (
	"backend/backend/internal/controllers"
	"backend/backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func authGroup(router *gin.Engine) *gin.RouterGroup {
	return router.Group("/", middleware.AuthMiddleware())
}

func NewRoutes(con *controllers.Controllers) *gin.Engine {
	router := gin.Default()
	router.Use(corsMiddleware())

	users := router.Group("/users")
	{
		users.POST("/login", con.UserController.Login)
		users.POST("/register", con.UserController.Register)
		users.DELETE("/delete", con.UserController.Delete)
	}

	auth := authGroup(router)

	quizzes := auth.Group("/quizzes")
	{
		quizzes.GET("", con.QuizController.GetQuizzes)
		quizzes.POST("", con.QuizController.Create)
		quizzes.GET("/:id/image", con.QuizController.GetQuizImage)
		quizzes.GET("/:id/questions", con.QuestionController.Get)
	}

	questions := auth.Group("/questions")
	{
		questions.POST("", con.QuestionController.Create)
		questions.POST("/answers", con.QuestionController.CreateWithAnswer)
	}

	answers := auth.Group("/answers")
	{
		answers.POST("/:id", con.AnswerController.Create)
		answers.GET("/:id", con.AnswerController.Get)
	}

	sessions := auth.Group("/game-sessions")
	{
		sessions.POST("", con.GameSessionController.Create)
		sessions.POST("/join", con.GameSessionController.Join)
		sessions.POST("/start", con.GameSessionController.Start)
		sessions.POST("/end", con.GameSessionController.End)
	}

	return router
}
