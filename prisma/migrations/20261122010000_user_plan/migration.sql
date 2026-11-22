-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('free', 'plus');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "plan" "UserPlan" NOT NULL DEFAULT 'free';
ALTER TABLE "users" ADD COLUMN "plan_period_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "users" ADD COLUMN "ai_suggest_used" INTEGER NOT NULL DEFAULT 0;

-- Existing accounts: period starts at account creation.
UPDATE "users" SET "plan_period_start" = "created_at";
