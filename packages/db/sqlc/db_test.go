package db

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
