-- AlterEnum
ALTER TYPE "AnalysisTriggerSource" ADD VALUE IF NOT EXISTS 'SYNC';

-- CreateEnum
CREATE TYPE "WatchEntryKind" AS ENUM ('MANUAL', 'SOON_RESOLUTION', 'HIGH_RISK', 'RECENT_ACTIVITY');

-- AlterTable
ALTER TABLE "watch_entries"
ADD COLUMN "kind" "WatchEntryKind" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "analysisRunId" TEXT,
ADD COLUMN "reason" TEXT,
ADD COLUMN "score" INTEGER,
ADD COLUMN "lastMatchedAt" TIMESTAMP(3);

-- DropIndex
DROP INDEX IF EXISTS "watch_entries_slug_key";

-- DropIndex
DROP INDEX IF EXISTS "watch_entries_enabled_updatedAt_idx";

-- CreateIndex
CREATE UNIQUE INDEX "watch_entries_kind_slug_key" ON "watch_entries"("kind", "slug");

-- CreateIndex
CREATE INDEX "watch_entries_kind_enabled_updatedAt_idx" ON "watch_entries"("kind", "enabled", "updatedAt");

-- AddForeignKey
ALTER TABLE "watch_entries"
ADD CONSTRAINT "watch_entries_analysisRunId_fkey"
FOREIGN KEY ("analysisRunId") REFERENCES "analysis_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
