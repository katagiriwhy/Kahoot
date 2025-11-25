package utils_test

import (
	"testing"

	"backend/internal/utils"
)

func TestGenerateAndValidateToken(t *testing.T) {
	utils.OverrideSecretKeyForTests([]byte("test-secret"))

	token, err := utils.GenerateToken(123)
	if err != nil {
		t.Fatalf("GenerateToken returned error: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	userID, err := utils.ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken returned error: %v", err)
	}
	if userID != 123 {
		t.Fatalf("expected userID 123, got %d", userID)
	}
}

func TestValidateTokenFailsWithDifferentSecret(t *testing.T) {
	utils.OverrideSecretKeyForTests([]byte("first-secret"))
	token, err := utils.GenerateToken(7)
	if err != nil {
		t.Fatalf("GenerateToken returned error: %v", err)
	}

	utils.OverrideSecretKeyForTests([]byte("different-secret"))
	if _, err := utils.ValidateToken(token); err == nil {
		t.Fatal("expected validation error with mismatched secret, got nil")
	}
}
