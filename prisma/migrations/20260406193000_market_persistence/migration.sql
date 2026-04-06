-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ResolutionRisk" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AnalysisTriggerSource" AS ENUM ('WEB', 'API', 'TELEGRAM', 'SEED', 'MANUAL');

-- CreateTable
CREATE TABLE "markets" (
    "id" TEXT NOT NULL,
    "polymarketId" TEXT NOT NULL,
    "primaryEventId" TEXT,
    "slug" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "resolutionSource" TEXT,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "marketType" TEXT,
    "formatType" TEXT,
    "conditionId" TEXT,
    "commentsEnabled" BOOLEAN,
    "disqusThread" TEXT,
    "hasReviewedDates" BOOLEAN,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "umaEndDate" TIMESTAMP(3),
    "closedTime" TIMESTAMP(3),
    "lowerBound" TEXT,
    "upperBound" TEXT,
    "lowerBoundDate" TIMESTAMP(3),
    "upperBoundDate" TIMESTAMP(3),
    "outcomes" TEXT[],
    "outcomePrices" DOUBLE PRECISION[],
    "liquidity" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "eventSlug" TEXT,
    "eventTitle" TEXT,
    "eventCategory" TEXT,
    "eventSubcategory" TEXT,
    "eventStartDate" TIMESTAMP(3),
    "eventEndDate" TIMESTAMP(3),
    "eventClosedTime" TIMESTAMP(3),
    "eventCommentCount" INTEGER,
    "eventCommentsEnabled" BOOLEAN,
    "rawMarket" JSONB NOT NULL,
    "rawEvent" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_comments" (
    "id" TEXT NOT NULL,
    "polymarketCommentId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "parentEntityType" TEXT,
    "parentEntityId" TEXT,
    "parentCommentId" TEXT,
    "body" TEXT,
    "userAddress" TEXT,
    "replyAddress" TEXT,
    "profileName" TEXT,
    "profileHandle" TEXT,
    "profileImage" TEXT,
    "profileWalletAddress" TEXT,
    "reactionCount" INTEGER,
    "reportCount" INTEGER,
    "upstreamCreatedAt" TIMESTAMP(3),
    "upstreamUpdatedAt" TIMESTAMP(3),
    "rawComment" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_runs" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "triggerSource" "AnalysisTriggerSource" NOT NULL DEFAULT 'WEB',
    "sourceInput" TEXT,
    "summary" TEXT NOT NULL,
    "resolutionSummary" TEXT NOT NULL,
    "resolutionSource" TEXT,
    "riskLabel" "ResolutionRisk" NOT NULL,
    "ambiguityFlags" JSONB NOT NULL,
    "criticalDates" JSONB NOT NULL,
    "marketFacts" JSONB NOT NULL,
    "rawAnalysis" JSONB NOT NULL,
    "rawUpstream" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_entries" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sourceInput" TEXT NOT NULL,
    "marketId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "markets_polymarketId_key" ON "markets"("polymarketId");

-- CreateIndex
CREATE UNIQUE INDEX "markets_slug_key" ON "markets"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "market_comments_polymarketCommentId_key" ON "market_comments"("polymarketCommentId");

-- CreateIndex
CREATE INDEX "market_comments_marketId_upstreamCreatedAt_idx" ON "market_comments"("marketId", "upstreamCreatedAt");

-- CreateIndex
CREATE INDEX "analysis_runs_marketId_createdAt_idx" ON "analysis_runs"("marketId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "watch_entries_slug_key" ON "watch_entries"("slug");

-- CreateIndex
CREATE INDEX "watch_entries_enabled_updatedAt_idx" ON "watch_entries"("enabled", "updatedAt");

-- AddForeignKey
ALTER TABLE "market_comments" ADD CONSTRAINT "market_comments_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_entries" ADD CONSTRAINT "watch_entries_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

