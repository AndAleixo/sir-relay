CREATE TABLE "project_categories" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_categories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_categories_project_id_idx" ON "project_categories"("project_id");

CREATE UNIQUE INDEX "project_categories_open_name" ON "project_categories"("project_id", lower("name")) WHERE "archived_at" IS NULL;

ALTER TABLE "project_categories" ADD CONSTRAINT "project_categories_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
