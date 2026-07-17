CREATE TYPE "GroupInvitationStatus" AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE "group_invitations" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "invited_user_id" TEXT NOT NULL,
    "invited_by_user_id" TEXT NOT NULL,
    "status" "GroupInvitationStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "group_invitations_group_id_invited_user_id_key"
ON "group_invitations"("group_id", "invited_user_id");

CREATE INDEX "group_invitations_invited_user_id_status_idx"
ON "group_invitations"("invited_user_id", "status");

CREATE INDEX "group_invitations_group_id_status_idx"
ON "group_invitations"("group_id", "status");

ALTER TABLE "group_invitations"
ADD CONSTRAINT "group_invitations_group_id_fkey"
FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_invitations"
ADD CONSTRAINT "group_invitations_invited_user_id_fkey"
FOREIGN KEY ("invited_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_invitations"
ADD CONSTRAINT "group_invitations_invited_by_user_id_fkey"
FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
