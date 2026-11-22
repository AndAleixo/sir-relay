-- Rename product plan free → basic (same entitlements; neutral naming).
ALTER TYPE "UserPlan" RENAME VALUE 'free' TO 'basic';
ALTER TABLE "users" ALTER COLUMN "plan" SET DEFAULT 'basic';
