-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterEnum
ALTER TYPE "ResolutionRisk" ADD VALUE IF NOT EXISTS 'UNKNOWN';

-- AlterTable
ALTER TABLE "analysis_runs"
ADD COLUMN "analysisVersion" TEXT NOT NULL DEFAULT 'deterministic-v1',
ADD COLUMN "engineName" TEXT NOT NULL DEFAULT 'deterministic',
ADD COLUMN "criticalDatesSummary" TEXT NOT NULL DEFAULT '',
ADD COLUMN "riskScore" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "confidenceLevel" "ConfidenceLevel" NOT NULL DEFAULT 'LOW',
ADD COLUMN "commentSignals" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "timezoneNotes" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "evidence" JSONB NOT NULL DEFAULT '[]';
