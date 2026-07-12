ALTER TABLE "group_alert_prefs"
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN "quiet_hours_start" INTEGER,
  ADD COLUMN "quiet_hours_end" INTEGER;
