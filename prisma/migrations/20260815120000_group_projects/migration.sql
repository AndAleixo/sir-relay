CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "acronym" VARCHAR(4) NOT NULL,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "projects_group_id_idx" ON "projects"("group_id");

CREATE UNIQUE INDEX "projects_group_open_acronym" ON "projects"("group_id", "acronym") WHERE "archived_at" IS NULL;

ALTER TABLE "projects" ADD CONSTRAINT "projects_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tasks" ADD COLUMN "project_id" TEXT;

CREATE INDEX "tasks_project_id_idx" ON "tasks"("project_id");

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
