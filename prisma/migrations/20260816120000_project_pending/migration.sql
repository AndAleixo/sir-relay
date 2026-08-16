-- Pending teammate requests: archived_at IS NULL AND pending_at IS NOT NULL.
ALTER TABLE "projects" ADD COLUMN "pending_at" TIMESTAMP(3);
