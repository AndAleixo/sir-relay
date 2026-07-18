-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "telegram_notify_failed" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "TelegramActivitySource" AS ENUM ('telegram');

-- CreateTable
CREATE TABLE "telegram_activity" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "source" "TelegramActivitySource" NOT NULL DEFAULT 'telegram',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "telegram_activity_task_id_created_at_idx" ON "telegram_activity"("task_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "telegram_activity_group_id_idx" ON "telegram_activity"("group_id");

-- AddForeignKey
ALTER TABLE "telegram_activity" ADD CONSTRAINT "telegram_activity_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_activity" ADD CONSTRAINT "telegram_activity_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_activity" ADD CONSTRAINT "telegram_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
