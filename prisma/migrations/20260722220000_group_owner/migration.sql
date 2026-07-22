-- Invisible group owner (creator / transferred). Role stays operator|teammate.
ALTER TABLE "groups" ADD COLUMN "owner_user_id" TEXT;

UPDATE "groups" AS g
SET "owner_user_id" = (
  SELECT gm."user_id"
  FROM "group_memberships" AS gm
  WHERE gm."group_id" = g."id" AND gm."role" = 'operator'
  ORDER BY gm."created_at" ASC
  LIMIT 1
)
WHERE g."owner_user_id" IS NULL;

UPDATE "groups" AS g
SET "owner_user_id" = (
  SELECT gm."user_id"
  FROM "group_memberships" AS gm
  WHERE gm."group_id" = g."id"
  ORDER BY gm."created_at" ASC
  LIMIT 1
)
WHERE g."owner_user_id" IS NULL;

-- Orphan groups without members cannot keep a required owner — delete empty shells.
DELETE FROM "groups" WHERE "owner_user_id" IS NULL;

ALTER TABLE "groups" ALTER COLUMN "owner_user_id" SET NOT NULL;

ALTER TABLE "groups"
  ADD CONSTRAINT "groups_owner_user_id_fkey"
  FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
