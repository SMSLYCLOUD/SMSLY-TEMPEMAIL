-- name: CreateUser :one
INSERT INTO users (email, password_hash)
VALUES ($1, $2)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1 LIMIT 1;

-- name: GetUserById :one
SELECT * FROM users WHERE id = $1 LIMIT 1;

-- name: CreateSession :one
INSERT INTO user_sessions (user_id, refresh_token, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetSessionByToken :one
SELECT * FROM user_sessions WHERE refresh_token = $1 LIMIT 1;

-- name: DeleteSession :exec
DELETE FROM user_sessions WHERE refresh_token = $1;

-- name: CreateSubscription :one
INSERT INTO subscriptions (user_id, stripe_customer_id, plan_tier, status)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetSubscriptionByUserId :one
SELECT * FROM subscriptions WHERE user_id = $1 LIMIT 1;
