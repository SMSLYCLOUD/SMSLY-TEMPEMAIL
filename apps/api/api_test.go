package main

import (
	"net/http/httptest"
	"testing"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestCreateInboxAPI(t *testing.T) {
	if queries == nil { t.Skip("Skipping integration test") }
	app := fiber.New()
	app.Post("/api/v1/inboxes", createInbox)

	req := httptest.NewRequest("POST", "/api/v1/inboxes", nil)
	resp, err := app.Test(req, -1)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}
