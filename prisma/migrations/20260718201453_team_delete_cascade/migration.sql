-- DropForeignKey
ALTER TABLE "jury_scores" DROP CONSTRAINT "jury_scores_team_id_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_target_team_id_fkey";

-- AddForeignKey
ALTER TABLE "jury_scores" ADD CONSTRAINT "jury_scores_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_target_team_id_fkey" FOREIGN KEY ("target_team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
