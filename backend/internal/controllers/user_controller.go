package controllers

import (
	"backend/backend/internal/types"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/mod/sumdb/storage"
	"net/http"
)

type UserController struct {
	db *storage.Storage
}

func NewUserController(db *storage.Storage) *UserController {
	return &UserController{db}
}

func (con *UserController) Register(c *gin.Context) {
	var body struct {
		UserName string `json:"username" binding:"required"`
		Login    string `json:"login" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body: " + err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.MinCost)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to generate password: " + err.Error()})
		return
	}

	const query = `INSERT INTO users (username, login, password) VALUES ($1, $2, $3)`

	user := types.User{UserName: body.UserName, Login: body.Login, Password: string(hash)}
	// TODO: finish token

	_, err = con.db.Q

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create user: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"email": user.Email,
	})
}

func (con *UserController) Delete(c *gin.Context) {
	var body struct {
		Email string `json:"email" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body: " + err.Error()})
		return
	}

	err := con.db.DeleteUserByEmail(c, body.Email)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to delete user: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Пользователь: " + body.Email + " успешно удален",
	})

}

func (con *UserController) Login(c *gin.Context) {
	var body struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body: " + err.Error()})
		return
	}

	user, err := con.db.GetByEmail(c, body.Email)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to find user: " + err.Error()})
		return
	}

	err = bcrypt.CompareHashAndPassword(user.PassHash, []byte(body.Password))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password is incorrect: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Welcome " + user.Email,
	})
}
