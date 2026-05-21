package main

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

	// Auth & Billing Hooks
	v1.Post("/auth/register", registerUser)
	v1.Post("/auth/login", loginUser)

	// Protected endpoints would use a JWT middleware here
	// v1.Post("/billing/checkout", jwtMiddleware(), createCheckoutSession)

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
				_, err := fmt.Fprintf(w, "data: %s\n\n", msg.Payload)
				if err != nil { return }
				err = w.Flush()
				if err != nil { return }
			case <-ticker.C:
				_, err := fmt.Fprintf(w, ": keepalive\n\n")
				if err != nil { return }
				err = w.Flush()
				if err != nil { return }
			}
		}
	}))

	return nil
}
