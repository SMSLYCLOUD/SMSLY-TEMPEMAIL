FROM golang:1.24-alpine AS builder

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
