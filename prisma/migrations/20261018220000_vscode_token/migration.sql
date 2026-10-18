ALTER TABLE "users" ADD COLUMN "vscode_token_hash" TEXT;

CREATE UNIQUE INDEX "users_vscode_token_hash_key" ON "users"("vscode_token_hash");
