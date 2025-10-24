package controllers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type UserController struct {
	db *pgxpool.Pool
}

func NewUserController(db *pgxpool.Pool) *UserController {
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

	var id int

	const query = `INSERT INTO users (username, login, password) VALUES ($1, $2, $3) RETURNING id`

	err = con.db.QueryRow(c, query, body.UserName, body.Login, string(hash)).Scan(&id)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create user: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"respond": fmt.Sprintf("User %s succesfully created", body.UserName),
	})
}

func (con *UserController) Delete(c *gin.Context) {
	var body struct {
		Login string `json:"login" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body: " + err.Error()})
		return
	}

	_, err := con.db.Exec(c, "DELETE FROM users WHERE login = $1", body.Login)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to delete user: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Пользователь: " + body.Login + " успешно удален",
	})

}

func (con *UserController) Login(c *gin.Context) {
	var body struct {
		Login    string `json:"login" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body: " + err.Error()})
		return
	}

	const query = `SELECT password, username FROM users WHERE login = $1`

	var hash, username string

	err := con.db.QueryRow(c, query, body.Login).Scan(&hash, &username)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to find user: " + err.Error()})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(hash), []byte(body.Password))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password is incorrect!"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Welcome " + username,
	})
}
