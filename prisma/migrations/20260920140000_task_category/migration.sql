ALTER TABLE "tasks" ADD COLUMN "category_id" TEXT;

CREATE INDEX "tasks_category_id_idx" ON "tasks"("category_id");

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "project_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
