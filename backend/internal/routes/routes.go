package routes

import (
	"backend/backend/internal/controllers"

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

func NewRoutes(con *controllers.Controllers) *gin.Engine {
	router := gin.Default()
	router.Use(corsMiddleware())

	users := router.Group("/users")
	{
		users.POST("/login", con.UserController.Login)
		users.POST("/register", con.UserController.Register)
		users.DELETE("/delete", con.UserController.Delete)
	}

	quizzes := router.Group("/quizzes")
	{
		quizzes.GET("", con.QuizController.GetQuizzes)
		quizzes.POST("", con.QuizController.Create)
		quizzes.GET("/:id/image", con.QuizController.GetQuizImage)
		quizzes.GET("/:id/questions", con.QuestionController.Get)

	}

	questions := router.Group("/questions")
	{
		questions.POST("", con.QuestionController.Create)
		questions.POST("/answers", con.QuestionController.CreateWithAnswer)
		questions.POST("/:id/answer", con.AnswerController.Create)
	}

	return router
}
