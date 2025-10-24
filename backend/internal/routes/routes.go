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

	router.POST("/login", con.UserController.Login)
	router.POST("/register", con.UserController.Register)
	router.DELETE("/delete", con.UserController.Delete)
	router.GET("/quizzes", con.QuizController.GetQuizzes)
	router.POST("quiz", con.QuizController.CreateQuiz)

	return router
}
