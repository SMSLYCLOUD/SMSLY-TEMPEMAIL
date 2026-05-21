package main

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
