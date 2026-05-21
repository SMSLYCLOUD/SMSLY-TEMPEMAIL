FROM golang:1.24-alpine AS builder
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
