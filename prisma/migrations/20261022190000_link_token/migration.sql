-- Clean break: rename column; clear hashes so clients must re-link with the new API.
ALTER TABLE "users" RENAME COLUMN "vscode_token_hash" TO "link_token_hash";
ALTER INDEX IF EXISTS "users_vscode_token_hash_key" RENAME TO "users_link_token_hash_key";
UPDATE "users" SET "link_token_hash" = NULL;
