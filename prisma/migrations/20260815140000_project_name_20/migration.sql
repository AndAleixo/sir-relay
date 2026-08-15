-- Truncate first: ALTER to VARCHAR(20) fails if any name is longer.
UPDATE "projects" SET "name" = LEFT("name", 20) WHERE char_length("name") > 20;

ALTER TABLE "projects" ALTER COLUMN "name" TYPE VARCHAR(20);
