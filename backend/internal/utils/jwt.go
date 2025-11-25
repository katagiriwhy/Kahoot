package utils

import (
	"os"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID int64 `json:"user_id"`
	jwt.RegisteredClaims
}

var (
	secretKey []byte
	secretMu  sync.RWMutex
)

func getSecretKey() []byte {
	secretMu.RLock()
	key := secretKey
	secretMu.RUnlock()
	if len(key) == 0 {
		secretMu.Lock()
		if len(secretKey) == 0 {
			secretKey = []byte(os.Getenv("JWT_SECRET"))
		}
		key = secretKey
		secretMu.Unlock()
	}
	return key
}

// OverrideSecretKeyForTests allows unit tests to inject a deterministic secret.
// It should not be used by application code outside of tests.
func OverrideSecretKeyForTests(key []byte) {
	secretMu.Lock()
	defer secretMu.Unlock()
	secretKey = key
}

func GenerateToken(userId int64) (string, error) {
	claims := Claims{
		UserID: userId,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * time.Duration(24))),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(getSecretKey())
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

func ValidateToken(tokenString string) (int64, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
		return getSecretKey(), nil
	})

	if err != nil || !token.Valid {
		return 0, err
	}
	return claims.UserID, nil
}
