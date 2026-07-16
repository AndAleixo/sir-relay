-- The removed group-scoped "Deactivate teammate" action set users.active=false
-- while retaining memberships. Account suspension is global, so restore those
-- legacy accounts before group membership removal replaces that behaviour.
UPDATE "users" AS u
SET "active" = true,
    "updated_at" = CURRENT_TIMESTAMP
WHERE u."active" = false
  AND EXISTS (
    SELECT 1
    FROM "group_memberships" AS gm
    WHERE gm."user_id" = u."id"
      AND gm."role" = 'teammate'
  );
