-- Scope teams to an event (ad-hoc groups) while keeping the permanent camp
-- roster as-is (event_id NULL).
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "event_id" TEXT;

DROP INDEX IF EXISTS "teams_name_key";
DROP INDEX IF EXISTS "teams_order_key";

CREATE UNIQUE INDEX "teams_event_id_name_key" ON "teams"("event_id", "name");
CREATE INDEX "teams_event_id_idx" ON "teams"("event_id");

ALTER TABLE "teams" ADD CONSTRAINT "teams_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
