package types

type User struct {
	ID       int    `json:"id" db:"id"`
	UserName string `json:"username" db:"username"`
	Login    string `json:"login" db:"login"`
	Password string `json:"password" db:"password"`
}
