-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Backfill queue order per assignee (due date, then created)
WITH ranked AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (
      PARTITION BY group_id, assignee_id
      ORDER BY due_date ASC NULLS LAST, created_at ASC
    ) - 1)::integer AS rn
  FROM "tasks"
  WHERE status <> 'done'
)
UPDATE "tasks" AS t
SET "sort_order" = ranked.rn
FROM ranked
WHERE t.id = ranked.id;

-- CreateIndex
CREATE INDEX "tasks_group_id_assignee_id_sort_order_idx" ON "tasks"("group_id", "assignee_id", "sort_order");
