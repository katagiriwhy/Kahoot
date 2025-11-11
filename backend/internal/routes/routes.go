package routes

import (
	"backend/backend/internal/controllers"
	"backend/backend/internal/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization, X-Requested-With",
		)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
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

	wsGroup := router.Group("/ws/game-sessions")
	{
		wsGroup.GET("/join", con.GameSessionController.Join)
	}

	sessions := auth.Group("/game-sessions")
	{
		sessions.POST("", con.GameSessionController.Create)
		sessions.POST("/start", con.GameSessionController.Start)
		sessions.POST("/end", con.GameSessionController.End)
		sessions.GET("/:id/players", con.SessionPlayersController.Get)
		sessions.DELETE("/:id/players", con.SessionPlayersController.Delete)
		sessions.DELETE("/:id", con.GameSessionController.Delete)
	}

	return router
}
