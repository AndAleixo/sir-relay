-- Optional task difficulty (easy / medium / hard)
CREATE TYPE "TaskDifficulty" AS ENUM ('easy', 'medium', 'hard');
ALTER TABLE "tasks" ADD COLUMN "difficulty" "TaskDifficulty";
