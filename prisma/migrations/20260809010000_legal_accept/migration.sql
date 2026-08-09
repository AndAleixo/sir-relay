-- Terms / Privacy acceptance (canonical English version id)
ALTER TABLE "users" ADD COLUMN "terms_version" TEXT;
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" TIMESTAMP(3);
