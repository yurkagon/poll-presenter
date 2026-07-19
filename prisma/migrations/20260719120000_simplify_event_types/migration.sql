-- Narrow EventType down to SCORE_ENTRY | EURO (no Event rows exist yet, so the
-- cast below never has to convert a removed value).
CREATE TYPE "EventType_new" AS ENUM ('SCORE_ENTRY', 'EURO');
ALTER TABLE "events" ALTER COLUMN "type" TYPE "EventType_new" USING ("type"::text::"EventType_new");
ALTER TYPE "EventType" RENAME TO "EventType_old";
ALTER TYPE "EventType_new" RENAME TO "EventType";
DROP TYPE "EventType_old";

-- Drop the now-unused INDIVIDUALS participant mode.
ALTER TABLE "events" ALTER COLUMN "participant_mode" DROP DEFAULT;
CREATE TYPE "ParticipantMode_new" AS ENUM ('TEAMS', 'ADHOC');
ALTER TABLE "events" ALTER COLUMN "participant_mode" TYPE "ParticipantMode_new" USING ("participant_mode"::text::"ParticipantMode_new");
ALTER TYPE "ParticipantMode" RENAME TO "ParticipantMode_old";
ALTER TYPE "ParticipantMode_new" RENAME TO "ParticipantMode";
DROP TYPE "ParticipantMode_old";
ALTER TABLE "events" ALTER COLUMN "participant_mode" SET DEFAULT 'TEAMS';

-- EventResult: add manual score entry, drop dead individual-award field.
ALTER TABLE "event_results" ADD COLUMN "scores" JSONB;
ALTER TABLE "event_results" DROP COLUMN "individual_winners";
