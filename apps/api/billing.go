package main

import (
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
)

func init() {
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
}

func createCheckoutSession(c *fiber.Ctx) error {
	// In a real implementation, we would extract the user from the JWT token middleware here
	// For now, this is a hook placeholder.
	userID := c.Locals("user_id").(string)
	if userID == "" {
		return jsonError(c, 401, "UNAUTHORIZED", "Must be logged in to subscribe")
	}

	domain := os.Getenv("FRONTEND_URL")
	if domain == "" {
		domain = "http://localhost:3000"
	}

	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(os.Getenv("STRIPE_PRO_PRICE_ID")),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(domain + "/admin/billing?success=true&session_id={CHECKOUT_SESSION_ID}"),
		CancelURL:  stripe.String(domain + "/admin/billing?canceled=true"),
	}

	s, err := session.New(params)
	if err != nil {
		return jsonError(c, 500, "STRIPE_ERROR", err.Error())
	}

	return jsonResponse(c, fiber.Map{
		"url": s.URL,
	})
}
