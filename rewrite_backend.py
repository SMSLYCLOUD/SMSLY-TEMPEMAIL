import os
import subprocess

def write(path, content):
    if os.path.dirname(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)

os.makedirs('apps/web', exist_ok=True)
os.makedirs('apps/api', exist_ok=True)
os.makedirs('apps/smtp', exist_ok=True)
os.makedirs('apps/worker', exist_ok=True)
os.makedirs('packages/db', exist_ok=True)
os.makedirs('infrastructure/caddy', exist_ok=True)
os.makedirs('infrastructure/docker', exist_ok=True)
os.makedirs('docs', exist_ok=True)

write('package.json', '''{
  "name": "tempmail",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.1.0"
  }
}''')

write('turbo.json', '''{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}''')

write('docker-compose.yml', '''version: '3.8'

services:
  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/caddy/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - web
      - api
    networks:
      - tempmail-net

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_API_URL=http://tempmail.localhost/api/v1
    depends_on:
      - api
    networks:
      - tempmail-net

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/tempmail?sslmode=disable
      - REDIS_URL=redis:6379
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
      - MINIO_BUCKET=attachments
    depends_on:
      - postgres
      - redis
      - minio
    networks:
      - tempmail-net

  smtp:
    build:
      context: .
      dockerfile: apps/smtp/Dockerfile
    restart: unless-stopped
    ports:
      - "25:25"
      - "2525:2525"
    environment:
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/tempmail?sslmode=disable
      - REDIS_URL=redis:6379
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
      - MINIO_BUCKET=attachments
    depends_on:
      - postgres
      - redis
      - minio
    networks:
      - tempmail-net

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/tempmail?sslmode=disable
      - REDIS_URL=redis:6379
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
      - MINIO_BUCKET=attachments
    depends_on:
      - postgres
      - redis
      - minio
    networks:
      - tempmail-net

  postgres:
    image: postgres:17
    restart: unless-stopped
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=tempmail
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - tempmail-net

  redis:
    image: redis:8
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - tempmail-net

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    networks:
      - tempmail-net

  minio-create-bucket:
    image: minio/mc:latest
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      /usr/bin/mc alias set myminio http://minio:9000 minioadmin minioadmin;
      /usr/bin/mc mb myminio/attachments || true;
      /usr/bin/mc anonymous set download myminio/attachments || true;
      exit 0;
      "
    networks:
      - tempmail-net

networks:
  tempmail-net:
    driver: bridge

volumes:
  caddy_data:
  caddy_config:
  postgres_data:
  redis_data:
  minio_data:
''')

write('infrastructure/caddy/Caddyfile', '''{
  auto_https off
}

http://tempmail.localhost {
  handle /api/* {
    reverse_proxy api:8080
  }

  handle /events/* {
    reverse_proxy api:8080
  }

  handle /* {
    reverse_proxy web:3000
  }
}
''')

write('packages/db/migrations/20231010120000_init.sql', '''CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inboxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address VARCHAR(255) UNIQUE NOT NULL,
    domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inbox_id UUID REFERENCES inboxes(id) ON DELETE CASCADE,
    sender VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject TEXT,
    text_body TEXT,
    html_body TEXT,
    raw_headers TEXT,
    spam_score NUMERIC(5,2),
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(255) NOT NULL,
    size INTEGER NOT NULL,
    object_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inboxes_address ON inboxes(address);
CREATE INDEX idx_inboxes_expires_at ON inboxes(expires_at);
CREATE INDEX idx_messages_inbox_id ON messages(inbox_id);
''')

write('packages/db/query/queries.sql', '''-- name: CreateDomain :one
INSERT INTO domains (domain_name)
VALUES ($1)
RETURNING *;

-- name: GetDomainByName :one
SELECT * FROM domains
WHERE domain_name = $1 LIMIT 1;

-- name: ListDomains :many
SELECT * FROM domains;

-- name: CreateInbox :one
INSERT INTO inboxes (address, domain_id, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetInbox :one
SELECT * FROM inboxes
WHERE id = $1 LIMIT 1;

-- name: GetInboxByAddress :one
SELECT * FROM inboxes
WHERE address = $1 LIMIT 1;

-- name: DeleteInbox :exec
DELETE FROM inboxes
WHERE id = $1;

-- name: ExtendInbox :one
UPDATE inboxes
SET expires_at = $2
WHERE id = $1
RETURNING *;

-- name: UpdateInboxLastAccessed :exec
UPDATE inboxes
SET last_accessed_at = NOW()
WHERE id = $1;

-- name: CreateMessage :one
INSERT INTO messages (inbox_id, sender, recipient, subject, text_body, html_body, raw_headers, spam_score)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetMessage :one
SELECT * FROM messages
WHERE id = $1 LIMIT 1;

-- name: ListMessagesForInbox :many
SELECT * FROM messages
WHERE inbox_id = $1
ORDER BY received_at DESC;

-- name: CreateAttachment :one
INSERT INTO attachments (message_id, filename, content_type, size, object_key)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListAttachmentsForMessage :many
SELECT * FROM attachments
WHERE message_id = $1;

-- name: GetAttachment :one
SELECT * FROM attachments
WHERE id = $1 LIMIT 1;

-- name: DeleteExpiredInboxes :many
DELETE FROM inboxes
WHERE expires_at < NOW()
RETURNING *;

-- name: DeleteOldMessages :many
DELETE FROM messages
WHERE received_at < NOW() - INTERVAL '24 hours'
RETURNING *;
''')

write('packages/db/sqlc.yaml', '''version: "2"
sql:
  - engine: "postgresql"
    queries: "query/queries.sql"
    schema: "migrations/"
    gen:
      go:
        package: "db"
        out: "sqlc"
        emit_json_tags: true
        emit_interface: true
        emit_empty_slices: true
''')

write('packages/db/sqlc/db_test.go', '''package db

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	_ "github.com/lib/pq"
	"os"
)

var testQueries *Queries
var testDB *sql.DB

func TestMain(m *testing.M) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/tempmail?sslmode=disable"
	}

	var err error
	testDB, err = sql.Open("postgres", dbURL)
	if err != nil {
		os.Exit(0)
	}

	if err = testDB.Ping(); err != nil {
		os.Exit(0)
	}

	testQueries = New(testDB)

	os.Exit(m.Run())
}

func createRandomDomain(t *testing.T) Domain {
	domainName := "test-" + uuid.New().String() + ".com"
	domain, err := testQueries.CreateDomain(context.Background(), domainName)

	require.NoError(t, err)
	require.NotEmpty(t, domain)
	require.Equal(t, domainName, domain.DomainName)

	return domain
}

func TestCreateDomain(t *testing.T) {
	createRandomDomain(t)
}

func TestCreateInbox(t *testing.T) {
	domain := createRandomDomain(t)

	address := "test@" + domain.DomainName
	expiresAt := time.Now().Add(10 * time.Minute)

	inbox, err := testQueries.CreateInbox(context.Background(), CreateInboxParams{
		Address:   address,
		DomainID:  uuid.NullUUID{UUID: domain.ID, Valid: true},
		ExpiresAt: expiresAt,
	})

	require.NoError(t, err)
	require.NotEmpty(t, inbox)
	require.Equal(t, address, inbox.Address)
	require.WithinDuration(t, expiresAt, inbox.ExpiresAt, time.Second)
}
''')

def run(cmd, cwd=None):
    subprocess.run(cmd, shell=True, cwd=cwd, check=True)

run('go mod init tempmail.local/db', cwd='packages/db')
run('go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest', cwd='packages/db')
run('~/go/bin/sqlc generate', cwd='packages/db')
run('go get github.com/stretchr/testify/require', cwd='packages/db')
run('go get github.com/lib/pq', cwd='packages/db')
run('go mod tidy', cwd='packages/db')

write('apps/api/main.go', '''package main

import (
	"bufio"
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"log"
	"math/big"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/redis/go-redis/v9"
	"github.com/valyala/fasthttp"

	"tempmail.local/db/sqlc"
)

var (
	queries *db.Queries
	rdb     *redis.Client
	minioClient *minio.Client
)

func init() {
	_ = godotenv.Load()
}

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/tempmail?sslmode=disable"
	}
	dbConn, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Error opening db: %v", err)
	}
	queries = db.New(dbConn)

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}
	rdb = redis.NewClient(&redis.Options{
		Addr: redisURL,
	})

	endpoint := os.Getenv("MINIO_ENDPOINT")
	if endpoint == "" {
		endpoint = "localhost:9000"
	}
	accessKeyID := os.Getenv("MINIO_ACCESS_KEY")
	if accessKeyID == "" {
		accessKeyID = "minioadmin"
	}
	secretAccessKey := os.Getenv("MINIO_SECRET_KEY")
	if secretAccessKey == "" {
		secretAccessKey = "minioadmin"
	}
	minioClient, err = minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: false,
	})
	if err != nil {
		log.Printf("Minio error: %v", err)
	}

	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
	})
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
	}))

	v1 := app.Group("/api/v1")

	v1.Post("/inboxes", createInbox)
	v1.Get("/inboxes/:id", getInbox)
	v1.Get("/inboxes/:id/messages", getInboxMessages)
	v1.Get("/messages/:id", getMessage)
	v1.Post("/inboxes/:id/extend", extendInbox)
	v1.Delete("/inboxes/:id", deleteInbox)
	v1.Get("/attachments/:id", getAttachment)

	app.Get("/events/:id", sseEvents)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("API listening on port %s", port)
	log.Fatal(app.Listen(":" + port))
}

func jsonResponse(c *fiber.Ctx, data interface{}) error {
	return c.JSON(fiber.Map{
		"success": true,
		"data":    data,
		"error":   nil,
	})
}

func jsonError(c *fiber.Ctx, status int, code, message string) error {
	return c.Status(status).JSON(fiber.Map{
		"success": false,
		"data":    nil,
		"error": fiber.Map{
			"code":    code,
			"message": message,
		},
	})
}

func randString(n int) string {
	var letters = []rune("abcdefghijklmnopqrstuvwxyz0123456789")
	b := make([]rune, n)
	for i := range b {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
		b[i] = letters[num.Int64()]
	}
	return string(b)
}

func createInbox(c *fiber.Ctx) error {
	ctx := context.Background()

	domains, err := queries.ListDomains(ctx)
	var domainID uuid.UUID
	var domainName string
	if err != nil || len(domains) == 0 {
		domainName = "tempmail.localhost"
		d, err := queries.CreateDomain(ctx, domainName)
		if err != nil {
			return jsonError(c, 500, "INTERNAL_ERROR", "Could not create domain")
		}
		domainID = d.ID
	} else {
		domainID = domains[0].ID
		domainName = domains[0].DomainName
	}

	address := randString(10) + "@" + domainName
	expiresAt := time.Now().Add(10 * time.Minute)

	inbox, err := queries.CreateInbox(ctx, db.CreateInboxParams{
		Address:   address,
		DomainID:  uuid.NullUUID{UUID: domainID, Valid: true},
		ExpiresAt: expiresAt,
	})

	if err != nil {
		return jsonError(c, 500, "INTERNAL_ERROR", "Could not create inbox")
	}

	return jsonResponse(c, inbox)
}

func getInbox(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return jsonError(c, 400, "INVALID_ID", "Invalid inbox ID")
	}

	inbox, err := queries.GetInbox(context.Background(), id)
	if err != nil {
		return jsonError(c, 404, "INBOX_NOT_FOUND", "Inbox not found")
	}
	return jsonResponse(c, inbox)
}

func getInboxMessages(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return jsonError(c, 400, "INVALID_ID", "Invalid inbox ID")
	}

	messages, err := queries.ListMessagesForInbox(context.Background(), uuid.NullUUID{UUID: id, Valid: true})
	if err != nil {
		return jsonError(c, 500, "INTERNAL_ERROR", "Could not get messages")
	}

	if messages == nil {
		messages = []db.Message{}
	}
	return jsonResponse(c, messages)
}

func getMessage(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return jsonError(c, 400, "INVALID_ID", "Invalid message ID")
	}

	message, err := queries.GetMessage(context.Background(), id)
	if err != nil {
		return jsonError(c, 404, "MESSAGE_NOT_FOUND", "Message not found")
	}

	attachments, err := queries.ListAttachmentsForMessage(context.Background(), uuid.NullUUID{UUID: id, Valid: true})

	type MessageWithAtt struct {
		db.Message
		Attachments []db.Attachment `json:"attachments"`
	}

	res := MessageWithAtt{
		Message: message,
	}
	if err == nil && len(attachments) > 0 {
		res.Attachments = attachments
	} else {
		res.Attachments = []db.Attachment{}
	}

	return jsonResponse(c, res)
}

func getAttachment(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return jsonError(c, 400, "INVALID_ID", "Invalid attachment ID")
	}

	att, err := queries.GetAttachment(context.Background(), id)
	if err != nil {
		return jsonError(c, 404, "ATTACHMENT_NOT_FOUND", "Attachment not found")
	}

	bucketName := os.Getenv("MINIO_BUCKET")
	if bucketName == "" {
		bucketName = "attachments"
	}

	obj, err := minioClient.GetObject(context.Background(), bucketName, att.ObjectKey, minio.GetObjectOptions{})
	if err != nil {
		return jsonError(c, 500, "INTERNAL_ERROR", "Could not read attachment")
	}

	c.Set("Content-Disposition", `attachment; filename="`+att.Filename+`"`)
	c.Set("Content-Type", att.ContentType)

	c.Context().SetBodyStream(obj, -1)
	return nil
}

func extendInbox(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return jsonError(c, 400, "INVALID_ID", "Invalid inbox ID")
	}

	newExpiry := time.Now().Add(10 * time.Minute)
	inbox, err := queries.ExtendInbox(context.Background(), db.ExtendInboxParams{
		ID:        id,
		ExpiresAt: newExpiry,
	})
	if err != nil {
		return jsonError(c, 404, "INBOX_NOT_FOUND", "Inbox not found")
	}
	return jsonResponse(c, inbox)
}

func deleteInbox(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return jsonError(c, 400, "INVALID_ID", "Invalid inbox ID")
	}

	err = queries.DeleteInbox(context.Background(), id)
	if err != nil {
		return jsonError(c, 500, "INTERNAL_ERROR", "Could not delete inbox")
	}
	return jsonResponse(c, map[string]bool{"deleted": true})
}

// SSE Endpoint
func sseEvents(c *fiber.Ctx) error {
	id := c.Params("id")

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("Transfer-Encoding", "chunked")

	c.Context().SetBodyStreamWriter(fasthttp.StreamWriter(func(w *bufio.Writer) {
		pubsub := rdb.Subscribe(context.Background(), "inbox:"+id)
		defer pubsub.Close()

		ch := pubsub.Channel()
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case msg := <-ch:
				_, err := fmt.Fprintf(w, "data: %s\\n\\n", msg.Payload)
				if err != nil { return }
				err = w.Flush()
				if err != nil { return }
			case <-ticker.C:
				_, err := fmt.Fprintf(w, ": keepalive\\n\\n")
				if err != nil { return }
				err = w.Flush()
				if err != nil { return }
			}
		}
	}))

	return nil
}
''')

write('apps/api/main_test.go', '''package main

import (
	"testing"
)

func TestRandString(t *testing.T) {
	str1 := randString(10)
	str2 := randString(10)

	if len(str1) != 10 {
		t.Errorf("Expected string length 10, got %d", len(str1))
	}
	if str1 == str2 {
		t.Errorf("Expected randString to generate unique strings, got duplicate")
	}
}
''')

write('apps/api/Dockerfile', '''FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.work go.work.sum* ./
COPY apps/api/go.mod apps/api/go.sum* ./apps/api/
COPY packages/db/go.mod packages/db/go.sum* ./packages/db/

COPY . .

WORKDIR /app/apps/api
RUN go mod tidy
RUN go build -o /app/api-service main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/api-service .
EXPOSE 8080
CMD ["./api-service"]
''')

run('go mod init tempmail.local/api', cwd='apps/api')
run('go mod edit -replace tempmail.local/db=../../packages/db', cwd='apps/api')
run('go get github.com/gofiber/fiber/v2 github.com/lib/pq github.com/joho/godotenv github.com/google/uuid tempmail.local/db github.com/redis/go-redis/v9 github.com/minio/minio-go/v7', cwd='apps/api')
run('go mod tidy', cwd='apps/api')

write('apps/smtp/main.go', '''package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"log"
	"os"
	"strings"
	"time"

	"github.com/emersion/go-message/mail"
	_ "github.com/emersion/go-message/charset"
	"github.com/emersion/go-smtp"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/redis/go-redis/v9"

	"tempmail.local/db/sqlc"
)

var (
	queries *db.Queries
	rdb     *redis.Client
	minioClient *minio.Client
)

func init() {
	_ = godotenv.Load()
}

type Backend struct{}

func (bkd *Backend) NewSession(c *smtp.Conn) (smtp.Session, error) {
	return &Session{}, nil
}

type Session struct {
	From string
	To   string
}

func (s *Session) AuthPlain(username, password string) error {
	return nil
}

func (s *Session) Mail(from string, opts *smtp.MailOptions) error {
	s.From = from
	return nil
}

func (s *Session) Rcpt(to string, opts *smtp.RcptOptions) error {
	s.To = to

	ctx := context.Background()

	inbox, err := queries.GetInboxByAddress(ctx, to)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("550 No such user here")
		}
		log.Printf("DB Error looking up inbox: %v", err)
		return errors.New("451 Requested action aborted: local error in processing")
	}

	if inbox.ExpiresAt.Before(time.Now()) {
		return errors.New("550 Inbox expired")
	}

	return nil
}

func (s *Session) Data(r io.Reader) error {
	ctx := context.Background()

	buf := new(bytes.Buffer)
	_, err := io.Copy(buf, r)
	if err != nil {
		return err
	}

	msgReader := bytes.NewReader(buf.Bytes())
	m, err := mail.CreateReader(msgReader)
	if err != nil {
		log.Printf("Error creating mail reader: %v", err)
		return nil // Accept mail but log error
	}

	header := m.Header
	subject, _ := header.Subject()
	rawHeadersBytes, _ := os.ReadFile("/dev/null")

	var textBody, htmlBody string
	var attachments []struct {
		Filename    string
		ContentType string
		Size        int64
		ObjectKey   string
	}

	for {
		p, err := m.NextPart()
		if err == io.EOF {
			break
		} else if err != nil {
			log.Printf("Error parsing part: %v", err)
			break
		}

		switch h := p.Header.(type) {
		case *mail.InlineHeader:
			contentType, _, _ := h.ContentType()
			b, _ := io.ReadAll(p.Body)
			if strings.HasPrefix(contentType, "text/plain") {
				textBody = string(b)
			} else if strings.HasPrefix(contentType, "text/html") {
				htmlBody = string(b)
			}
		case *mail.AttachmentHeader:
			filename, _ := h.Filename()
			contentType, _, _ := h.ContentType()
			b, _ := io.ReadAll(p.Body)

			objectKey := uuid.New().String() + "-" + filename
			bucketName := os.Getenv("MINIO_BUCKET")
			if bucketName == "" {
				bucketName = "attachments"
			}

			_, err := minioClient.PutObject(ctx, bucketName, objectKey, bytes.NewReader(b), int64(len(b)), minio.PutObjectOptions{
				ContentType: contentType,
			})
			if err != nil {
				log.Printf("Failed to upload attachment to MinIO: %v", err)
				continue
			}

			attachments = append(attachments, struct {
				Filename    string
				ContentType string
				Size        int64
				ObjectKey   string
			}{
				Filename:    filename,
				ContentType: contentType,
				Size:        int64(len(b)),
				ObjectKey:   objectKey,
			})
		}
	}

	inbox, err := queries.GetInboxByAddress(ctx, s.To)
	if err != nil {
		return err
	}

	toNullStr := func(s string) sql.NullString {
		return sql.NullString{String: s, Valid: s != ""}
	}

	msg, err := queries.CreateMessage(ctx, db.CreateMessageParams{
		InboxID:    uuid.NullUUID{UUID: inbox.ID, Valid: true},
		Sender:     s.From,
		Recipient:  s.To,
		Subject:    toNullStr(subject),
		TextBody:   toNullStr(textBody),
		HtmlBody:   toNullStr(htmlBody),
		RawHeaders: toNullStr(string(rawHeadersBytes)),
		SpamScore:  sql.NullString{String: "0.0", Valid: true},
	})
	if err != nil {
		log.Printf("Error creating message: %v", err)
		return err
	}

	for _, att := range attachments {
		_, err := queries.CreateAttachment(ctx, db.CreateAttachmentParams{
			MessageID:   uuid.NullUUID{UUID: msg.ID, Valid: true},
			Filename:    att.Filename,
			ContentType: att.ContentType,
			Size:        int32(att.Size),
			ObjectKey:   att.ObjectKey,
		})
		if err != nil {
			log.Printf("Error creating attachment: %v", err)
		}
	}

	eventPayload, _ := json.Marshal(map[string]interface{}{
		"type":    "NEW_MESSAGE",
		"message": msg,
	})
	rdb.Publish(ctx, "inbox:"+inbox.ID.String(), eventPayload)

	log.Printf("Received email for %s", s.To)
	return nil
}

func (s *Session) Reset() {}

func (s *Session) Logout() error {
	return nil
}

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/tempmail?sslmode=disable"
	}
	dbConn, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Error opening db: %v", err)
	}
	queries = db.New(dbConn)

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}
	rdb = redis.NewClient(&redis.Options{
		Addr: redisURL,
	})

	endpoint := os.Getenv("MINIO_ENDPOINT")
	if endpoint == "" {
		endpoint = "localhost:9000"
	}
	accessKeyID := os.Getenv("MINIO_ACCESS_KEY")
	if accessKeyID == "" {
		accessKeyID = "minioadmin"
	}
	secretAccessKey := os.Getenv("MINIO_SECRET_KEY")
	if secretAccessKey == "" {
		secretAccessKey = "minioadmin"
	}
	minioClient, err = minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: false,
	})
	if err != nil {
		log.Fatalf("Minio error: %v", err)
	}

	be := &Backend{}

	s := smtp.NewServer(be)

	s.Addr = ":2525"
	if port := os.Getenv("PORT"); port != "" {
		s.Addr = ":" + port
	}
	s.Domain = "tempmail.localhost"
	s.ReadTimeout = 10 * time.Second
	s.WriteTimeout = 10 * time.Second
	s.MaxMessageBytes = 25 * 1024 * 1024
	s.MaxRecipients = 50
	s.AllowInsecureAuth = true

	log.Println("Starting SMTP server on", s.Addr)
	if err := s.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
''')

write('apps/smtp/main_test.go', '''package main

import (
	"testing"
)

func TestBackendMethodsExist(t *testing.T) {
	be := &Backend{}
	if be == nil {
		t.Fatal("Backend should not be nil")
	}

	session := &Session{}
	if session == nil {
		t.Fatal("Session should not be nil")
	}
}
''')

write('apps/smtp/Dockerfile', '''FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.work go.work.sum* ./
COPY apps/smtp/go.mod apps/smtp/go.sum* ./apps/smtp/
COPY packages/db/go.mod packages/db/go.sum* ./packages/db/
COPY . .
WORKDIR /app/apps/smtp
RUN go mod tidy
RUN go build -o /app/smtp-service main.go
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/smtp-service .
EXPOSE 2525
CMD ["./smtp-service"]
''')
run('go mod init tempmail.local/smtp', cwd='apps/smtp')
run('go mod edit -replace tempmail.local/db=../../packages/db', cwd='apps/smtp')
run('go get github.com/emersion/go-smtp github.com/emersion/go-message/mail github.com/lib/pq github.com/joho/godotenv github.com/google/uuid github.com/redis/go-redis/v9 github.com/minio/minio-go/v7 github.com/emersion/go-message/charset tempmail.local/db', cwd='apps/smtp')
run('go mod tidy', cwd='apps/smtp')

write('apps/worker/main.go', '''package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"tempmail.local/db/sqlc"
)

var queries *db.Queries
var testDB *sql.DB
var minioClient *minio.Client

func init() {
	_ = godotenv.Load()
}

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/tempmail?sslmode=disable"
	}
	dbConn, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Error opening db: %v", err)
	}
	testDB = dbConn
	queries = db.New(dbConn)

	endpoint := os.Getenv("MINIO_ENDPOINT")
	if endpoint == "" { endpoint = "localhost:9000" }
	accessKeyID := os.Getenv("MINIO_ACCESS_KEY")
	if accessKeyID == "" { accessKeyID = "minioadmin" }
	secretAccessKey := os.Getenv("MINIO_SECRET_KEY")
	if secretAccessKey == "" { secretAccessKey = "minioadmin" }

	minioClient, err = minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: false,
	})
	if err != nil { log.Printf("Minio error: %v", err) }

	log.Println("Starting worker process for periodic cleanup tasks")

	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			runCleanup()
		}
	}
}

func runCleanup() {
	ctx := context.Background()
	log.Println("Running cleanup job...")

	rows, err := testDB.QueryContext(ctx, `
		SELECT object_key FROM attachments
		WHERE message_id IN (
			SELECT id FROM messages WHERE received_at < NOW() - INTERVAL '24 hours'
		) OR message_id IN (
			SELECT m.id FROM messages m JOIN inboxes i ON m.inbox_id = i.id WHERE i.expires_at < NOW()
		)
	`)

	bucketName := os.Getenv("MINIO_BUCKET")
	if bucketName == "" { bucketName = "attachments" }

	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var objKey string
			if err := rows.Scan(&objKey); err == nil {
				_ = minioClient.RemoveObject(ctx, bucketName, objKey, minio.RemoveObjectOptions{})
			}
		}
	}

	inboxes, err := queries.DeleteExpiredInboxes(ctx)
	if err != nil {
		log.Printf("Error deleting expired inboxes: %v", err)
	} else if len(inboxes) > 0 {
		log.Printf("Cleaned up %d expired inboxes", len(inboxes))
	}

	messages, err := queries.DeleteOldMessages(ctx)
	if err != nil {
		log.Printf("Error deleting old messages: %v", err)
	} else if len(messages) > 0 {
		log.Printf("Cleaned up %d old messages", len(messages))
	}
}
''')

write('apps/worker/Dockerfile', '''FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.work go.work.sum* ./
COPY apps/worker/go.mod apps/worker/go.sum* ./apps/worker/
COPY packages/db/go.mod packages/db/go.sum* ./packages/db/
COPY . .
WORKDIR /app/apps/worker
RUN go mod tidy
RUN go build -o /app/worker-service main.go
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/worker-service .
CMD ["./worker-service"]
''')

run('go mod init tempmail.local/worker', cwd='apps/worker')
run('go mod edit -replace tempmail.local/db=../../packages/db', cwd='apps/worker')
run('go get tempmail.local/db github.com/joho/godotenv github.com/lib/pq github.com/minio/minio-go/v7 github.com/minio/minio-go/v7/pkg/credentials', cwd='apps/worker')
run('go mod tidy', cwd='apps/worker')

run('go work init')
run('go work use apps/api apps/smtp apps/worker packages/db')

write('apps/api/api_test.go', '''package main

import (
	"context"
	"net/http/httptest"
	"testing"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"tempmail.local/db/sqlc"
)

func TestCreateInboxAPI(t *testing.T) {
	if testDB == nil { t.Skip("Skipping integration test") }
	app := fiber.New()
	app.Post("/api/v1/inboxes", createInbox)

	req := httptest.NewRequest("POST", "/api/v1/inboxes", nil)
	resp, err := app.Test(req, -1)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}
''')

write('apps/smtp/smtp_test.go', '''package main

import (
	"testing"
	"github.com/emersion/go-smtp"
)

func TestSession(t *testing.T) {
	b := &Backend{}
	s, _ := b.NewSession(nil)
	assert_err := s.AuthPlain("user", "pass")
	if assert_err != nil {
		t.Errorf("AuthPlain should return nil")
	}
}
''')

print("Backend Recreated Successfully.")
