-- Named API keys for editor / MCP (multi-key; optional group scope).
-- Clean break: drop single-hash column on users; clients create keys again from /connect.
CREATE TABLE "client_api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "group_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "client_api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_api_keys_token_hash_key" ON "client_api_keys"("token_hash");
CREATE INDEX "client_api_keys_user_id_idx" ON "client_api_keys"("user_id");

ALTER TABLE "client_api_keys"
  ADD CONSTRAINT "client_api_keys_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "users_link_token_hash_key";
ALTER TABLE "users" DROP COLUMN IF EXISTS "link_token_hash";
