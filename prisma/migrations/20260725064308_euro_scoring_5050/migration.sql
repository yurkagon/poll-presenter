-- AlterTable
ALTER TABLE "event_results" ADD COLUMN     "audience_voters" INTEGER;

-- AlterTable
ALTER TABLE "jury_scores" ALTER COLUMN "points" SET DEFAULT 0,
ALTER COLUMN "points" SET DATA TYPE DOUBLE PRECISION;
