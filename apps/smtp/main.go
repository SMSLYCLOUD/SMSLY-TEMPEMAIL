package main

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
