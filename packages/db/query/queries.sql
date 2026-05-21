-- name: CreateDomain :one
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
