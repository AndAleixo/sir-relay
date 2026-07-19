-- Phase 2 audit log (P2-AUD)
CREATE TYPE "AuditActorType" AS ENUM ('operator', 'teammate', 'system');

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "group_id" TEXT,
    "action" TEXT NOT NULL,
    "actor_type" "AuditActorType" NOT NULL,
    "actor_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_group_id_created_at_idx" ON "audit_logs"("group_id", "created_at" DESC);
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
