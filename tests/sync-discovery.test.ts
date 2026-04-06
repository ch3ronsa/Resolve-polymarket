import test from "node:test";
import assert from "node:assert/strict";

import { deriveDiscoveryCandidates, scoreDiscoveryCandidate } from "@/lib/sync/discovery";
import type { PolymarketEvent } from "@/lib/polymarket/types";

const now = new Date("2026-04-07T12:00:00.000Z").getTime();

test("scoreDiscoveryCandidate prioritizes volume, liquidity, near resolution, and comments", () => {
  const result = scoreDiscoveryCandidate(
    {
      slug: "high-priority-market",
      question: "High priority market?",
      eventSlug: "event-a",
      eventTitle: "Event A",
      eventCommentCount: 5,
      commentsEnabled: true,
      volume: 100000,
      liquidity: 45000,
      endDate: "2026-04-08T12:00:00.000Z"
    },
    {
      discoveryEventLimit: 10,
      marketMaxPerRun: 5,
      minVolume: 20000,
      minLiquidity: 10000,
      nearResolutionHours: 72,
      minCommentCount: 2,
      marketActivityWeight: 1
    },
    now
  );

  assert.ok(result.score > 0);
  assert.deepEqual(result.reasons, [
    "volume",
    "liquidity",
    "near_resolution",
    "comment_activity"
  ]);
});

test("deriveDiscoveryCandidates filters inactive markets, dedupes slugs, and sorts by score", () => {
  const events: PolymarketEvent[] = [
    {
      id: "event-1",
      ticker: null,
      slug: "event-one",
      title: "Event One",
      subtitle: null,
      description: null,
      resolutionSource: null,
      startDate: null,
      creationDate: null,
      endDate: "2026-04-09T12:00:00.000Z",
      image: null,
      icon: null,
      active: true,
      closed: false,
      archived: false,
      featured: false,
      restricted: false,
      liquidity: 10000,
      volume: 20000,
      openInterest: null,
      category: null,
      subcategory: null,
      commentsEnabled: true,
      commentCount: 3,
      disqusThread: null,
      closedTime: null,
      markets: [
        {
          id: "market-1",
          slug: "priority-market",
          question: "Priority market?",
          endDate: "2026-04-08T12:00:00.000Z",
          active: true,
          closed: false,
          marketType: "binary",
          formatType: "binary",
          commentsEnabled: true,
          volume: 90000,
          liquidity: 35000
        },
        {
          id: "market-2",
          slug: "inactive-market",
          question: "Inactive market?",
          endDate: "2026-04-08T12:00:00.000Z",
          active: false,
          closed: false,
          marketType: "binary",
          formatType: "binary",
          commentsEnabled: true,
          volume: 90000,
          liquidity: 35000
        }
      ]
    },
    {
      id: "event-2",
      ticker: null,
      slug: "event-two",
      title: "Event Two",
      subtitle: null,
      description: null,
      resolutionSource: null,
      startDate: null,
      creationDate: null,
      endDate: "2026-05-01T12:00:00.000Z",
      image: null,
      icon: null,
      active: true,
      closed: false,
      archived: false,
      featured: false,
      restricted: false,
      liquidity: 5000,
      volume: 6000,
      openInterest: null,
      category: null,
      subcategory: null,
      commentsEnabled: false,
      commentCount: 0,
      disqusThread: null,
      closedTime: null,
      markets: [
        {
          id: "market-3",
          slug: "priority-market",
          question: "Priority market duplicate?",
          endDate: "2026-04-10T12:00:00.000Z",
          active: true,
          closed: false,
          marketType: "binary",
          formatType: "binary",
          commentsEnabled: false,
          volume: 1000,
          liquidity: 1000
        }
      ]
    }
  ];

  const candidates = deriveDiscoveryCandidates(events, {
    thresholds: {
      discoveryEventLimit: 20,
      marketMaxPerRun: 10,
      minVolume: 10000,
      minLiquidity: 10000,
      nearResolutionHours: 72,
      minCommentCount: 2,
      marketActivityWeight: 1
    },
    now
  });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.slug, "priority-market");
  assert.ok(candidates[0]!.score > 0);
});
