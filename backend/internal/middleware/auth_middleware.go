package middleware

import (
	"backend/backend/internal/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie("session_token")
		if err != nil || token == "" {
			header := c.GetHeader("Authorization")
			if header == "" {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "no auth token"})
				return
			}
			parts := strings.Split(header, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid auth header"})
				return
			}
			token = parts[1]
		}

		userID, err := utils.ValidateToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		c.Set("user_id", userID)
		c.Next()
	}
}
