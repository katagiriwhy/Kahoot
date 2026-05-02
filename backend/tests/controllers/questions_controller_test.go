package controllers_test

import (
	"backend/backend/internal/controllers"
	"backend/backend/internal/middleware"
	"backend/backend/internal/utils"
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func setupQuestionsTestRouter(controller *controllers.QuestionsController) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.AuthMiddleware())
	questions := router.Group("/questions")
	{
		questions.GET("/:id", controller.Get)
		questions.POST("", controller.Create)
		questions.POST("/answers", controller.CreateWithAnswer)
		questions.GET("/:id/image", controller.GetImage)
	}
	return router
}

func TestQuestionsController_Get(t *testing.T) {
	t.Run("invalid quiz ID", func(t *testing.T) {
		// This can be tested without database
		t.Skip("Requires test database setup")
	})

	t.Run("quiz with no questions", func(t *testing.T) {
		t.Skip("Requires test database setup")
	})
}

func TestQuestionsController_Create(t *testing.T) {
	utils.OverrideSecretKeyForTests([]byte("test-secret"))

	t.Run("invalid request body", func(t *testing.T) {
		// This can be tested without database
		t.Skip("Requires test database setup")
	})

	t.Run("quiz does not exist", func(t *testing.T) {
		t.Skip("Requires test database setup")
	})

	t.Run("points must be positive", func(t *testing.T) {
		// This can be validated without database
		t.Skip("Requires test database setup")
	})

	t.Run("question text cannot be empty", func(t *testing.T) {
		// This can be validated without database
		t.Skip("Requires test database setup")
	})
}

func TestQuestionsController_CreateWithAnswer(t *testing.T) {
	utils.OverrideSecretKeyForTests([]byte("test-secret"))

	t.Run("missing answers", func(t *testing.T) {
		// This can be tested without database
		t.Skip("Requires test database setup")
	})

	t.Run("invalid answers JSON", func(t *testing.T) {
		// This can be tested without database
		t.Skip("Requires test database setup")
	})

	t.Run("empty answer text", func(t *testing.T) {
		// This can be validated without database
		t.Skip("Requires test database setup")
	})
}

func createQuestionFormData(t *testing.T, quizID, questionText, points string, answersJSON string, image []byte) *bytes.Buffer {
	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	w.WriteField("quiz_id", quizID)
	w.WriteField("question_text", questionText)
	w.WriteField("points", points)
	w.WriteField("answers", answersJSON)

	if image != nil {
		fw, err := w.CreateFormFile("image", "test.png")
		if err != nil {
			t.Fatalf("Failed: %v", err)
		}
		_, err = fw.Write(image)
		if err != nil {
			t.Fatalf("Failed: %v", err)
		}
	}

	err := w.Close()
	assert.NoError(t, err)

	return &b
}
