-- Truncate first: ALTER to VARCHAR(3) fails if any acronym is longer.
-- ponytail: two open projects that share a 3-letter prefix will hit the unique index.
UPDATE "projects" SET "acronym" = LEFT("acronym", 3) WHERE char_length("acronym") > 3;

ALTER TABLE "projects" ALTER COLUMN "acronym" TYPE VARCHAR(3);
