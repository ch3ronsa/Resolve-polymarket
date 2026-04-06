import test from "node:test";
import assert from "node:assert/strict";

import { analyzeMarket } from "@/lib/analysis/market-analysis";

import cleanFixture from "@/prisma/fixtures/demo-clean-binary.json";
import disputeFixture from "@/prisma/fixtures/demo-comment-dispute.json";
import timezoneFixture from "@/prisma/fixtures/demo-timezone-sensitive.json";

test("deterministic analysis keeps a clean binary fixture in a lower risk bucket", () => {
  const result = analyzeMarket({
    market: cleanFixture.market,
    event: cleanFixture.event,
    comments: cleanFixture.comments,
    sourceInput: cleanFixture.sourceInput
  });

  assert.equal(result.riskLevel, "low");
  assert.ok(result.riskScore < 34);
  assert.equal(result.commentSignals.length, 0);
});

test("deterministic analysis detects timezone-sensitive wording and missing source", () => {
  const result = analyzeMarket({
    market: timezoneFixture.market,
    event: timezoneFixture.event,
    comments: timezoneFixture.comments,
    sourceInput: timezoneFixture.sourceInput
  });

  assert.equal(result.riskLevel, "high");
  assert.ok(result.ambiguityFlags.some((flag) => flag.title === "Missing resolution source"));
  assert.ok(
    result.ambiguityFlags.some((flag) => flag.title === "Timezone-sensitive interpretation")
  );
});

test("deterministic analysis lifts dispute and clarification signals from comments", () => {
  const result = analyzeMarket({
    market: disputeFixture.market,
    event: disputeFixture.event,
    comments: disputeFixture.comments,
    sourceInput: disputeFixture.sourceInput
  });

  assert.ok(result.commentSignals.some((signal) => signal.kind === "dispute"));
  assert.ok(result.commentSignals.some((signal) => signal.kind === "clarification"));
  assert.ok(result.riskScore >= 34);
});
