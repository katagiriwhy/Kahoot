package types

type User struct {
	ID       int    `json:"id" db:"id"`
	UserName string `json:"username" db:"username"`
	Login    string `json:"login" db:"login"`
	Password string `json:"password" db:"password"`
}

func (u User) GetTableName() string {
	return "users"
}

func (u User) GetFields() map[string]interface{} {
	return map[string]interface{}{
		"id":       u.ID,
		"username": u.UserName,
		"login":    u.Login,
		"password": u.Password,
	}
}
