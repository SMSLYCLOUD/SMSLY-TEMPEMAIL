FROM golang:1.24-alpine AS builder
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
