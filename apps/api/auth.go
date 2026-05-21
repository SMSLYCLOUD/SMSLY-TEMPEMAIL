package main

import (
	"context"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"tempmail.local/db/sqlc"
)

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func getJwtSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		panic("CRITICAL: JWT_SECRET environment variable is missing!")
	}
	return []byte(secret)
}

func registerUser(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return jsonError(c, 400, "BAD_REQUEST", "Invalid request body")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return jsonError(c, 500, "INTERNAL_ERROR", "Could not hash password")
	}

	user, err := queries.CreateUser(context.Background(), db.CreateUserParams{
		Email:        req.Email,
		PasswordHash: string(hash),
	})
	if err != nil {
		return jsonError(c, 400, "USER_EXISTS", "Email already in use")
	}

	user.PasswordHash = "" // hide hash
	return jsonResponse(c, user)
}

func loginUser(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return jsonError(c, 400, "BAD_REQUEST", "Invalid request body")
	}

	user, err := queries.GetUserByEmail(context.Background(), req.Email)
	if err != nil {
		return jsonError(c, 401, "UNAUTHORIZED", "Invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return jsonError(c, 401, "UNAUTHORIZED", "Invalid credentials")
	}

	// Generate JWT Access Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID.String(),
		"exp": time.Now().Add(15 * time.Minute).Unix(),
	})

	tokenString, err := token.SignedString(getJwtSecret())
	if err != nil {
		return jsonError(c, 500, "INTERNAL_ERROR", "Could not generate token")
	}

	// Generate Refresh Token
	refreshTokenStr := randString(32)
	_, err = queries.CreateSession(context.Background(), db.CreateSessionParams{
		UserID:       uuid.NullUUID{UUID: user.ID, Valid: true},
		RefreshToken: refreshTokenStr,
		ExpiresAt:    time.Now().Add(7 * 24 * time.Hour),
	})
	if err != nil {
		return jsonError(c, 500, "INTERNAL_ERROR", "Could not create session")
	}

	return jsonResponse(c, fiber.Map{
		"access_token":  tokenString,
		"refresh_token": refreshTokenStr,
		"user": fiber.Map{
			"id":    user.ID,
			"email": user.Email,
			"role":  user.Role.String,
		},
	})
}
