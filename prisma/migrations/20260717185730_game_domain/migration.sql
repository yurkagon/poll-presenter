-- CreateEnum
CREATE TYPE "DisplayMode" AS ENUM ('LOBBY', 'EVENT', 'LEADERBOARD', 'IDLE');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('PUNCT', 'SPORT', 'CREATIVE', 'GENERAL');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PLACEMENT', 'HYBRID', 'INDIVIDUAL', 'SIMPLE_VOTE', 'EURO_VOTE', 'JURY');

-- CreateEnum
CREATE TYPE "EventWeight" AS ENUM ('NORMAL', 'BIG', 'KEY');

-- CreateEnum
CREATE TYPE "ParticipantMode" AS ENUM ('TEAMS', 'ADHOC', 'INDIVIDUALS');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'LOBBY', 'OPEN', 'CLOSED', 'REVEALED', 'COMPLETED');

-- CreateTable
CREATE TABLE "app_state" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "display_mode" "DisplayMode" NOT NULL DEFAULT 'LOBBY',
    "active_event_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "days" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_results" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "placement" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audience_raw" JSONB,
    "jury_raw" JSONB,
    "individual_winners" JSONB,
    "computed_points" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "day_id" TEXT,
    "category" "EventCategory" NOT NULL DEFAULT 'GENERAL',
    "type" "EventType" NOT NULL,
    "weight" "EventWeight" NOT NULL DEFAULT 'NORMAL',
    "participant_mode" "ParticipantMode" NOT NULL DEFAULT 'TEAMS',
    "affects_score" BOOLEAN NOT NULL DEFAULT true,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "reveal_step" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jury_scores" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jury_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "name" TEXT,
    "team_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "target_team_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "days_order_key" ON "days"("order");

-- CreateIndex
CREATE UNIQUE INDEX "event_results_event_id_key" ON "event_results"("event_id");

-- CreateIndex
CREATE INDEX "events_day_id_idx" ON "events"("day_id");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "jury_scores_event_id_idx" ON "jury_scores"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "jury_scores_event_id_team_id_key" ON "jury_scores"("event_id", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "participants_device_id_key" ON "participants"("device_id");

-- CreateIndex
CREATE INDEX "participants_team_id_idx" ON "participants"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_order_key" ON "teams"("order");

-- CreateIndex
CREATE INDEX "votes_event_id_idx" ON "votes"("event_id");

-- CreateIndex
CREATE INDEX "votes_target_team_id_idx" ON "votes"("target_team_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_event_id_participant_id_rank_key" ON "votes"("event_id", "participant_id", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "votes_event_id_participant_id_target_team_id_key" ON "votes"("event_id", "participant_id", "target_team_id");

-- AddForeignKey
ALTER TABLE "event_results" ADD CONSTRAINT "event_results_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jury_scores" ADD CONSTRAINT "jury_scores_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jury_scores" ADD CONSTRAINT "jury_scores_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_target_team_id_fkey" FOREIGN KEY ("target_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
