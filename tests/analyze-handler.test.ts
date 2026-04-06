import test from "node:test";
import assert from "node:assert/strict";

import { handleAnalyzeRequestPayload } from "@/lib/api/analyze-handler";
import { successResponseSchema } from "@/lib/api/schemas";
import { analyzeDataSchema } from "@/lib/api/schemas";

import cleanFixture from "@/prisma/fixtures/demo-clean-binary.json";

const responseSchema = successResponseSchema(analyzeDataSchema);

test("handleAnalyzeRequestPayload returns a validated happy-path response", async () => {
  const response = await handleAnalyzeRequestPayload(
    {
      input: cleanFixture.sourceInput,
      forceRefresh: false
    },
    "req-test-1",
    {
      runAnalysis: async () => ({
        slug: cleanFixture.market.slug,
        market: cleanFixture.market,
        analysis: {
          version: "deterministic-v1",
          engineName: "deterministic",
          summary: "A deterministic summary.",
          resolutionSource: cleanFixture.market.resolutionSource,
          resolutionSourceSummary: "Specific official source present.",
          criticalDatesSummary: "One critical date was returned.",
          timezoneNotes: ["Rendered in UTC."],
          ambiguityFlags: [],
          commentSignals: [],
          criticalDates: [
            {
              label: "Market end",
              iso: cleanFixture.market.endDate ?? "",
              display: "Jul 29, 2026, 6:00 PM",
              detail: "Primary end date."
            }
          ],
          marketFacts: [
            {
              label: "Slug",
              value: cleanFixture.market.slug
            }
          ],
          evidence: [],
          riskScore: 18,
          riskLevel: "low",
          confidenceLevel: "high"
        },
        analysisRun: {
          id: "analysis-run-1",
          createdAt: "2026-04-07T12:00:00.000Z",
          triggerSource: "API",
          analysisVersion: "deterministic-v1",
          engineName: "deterministic",
          cached: false
        },
        commentsFetched: 1
      }),
      logInfo: () => undefined,
      logError: () => undefined,
      now: () => new Date("2026-04-07T12:00:01.000Z")
    }
  );

  assert.equal(response.status, 200);

  const payload = await response.json();
  const parsed = responseSchema.parse(payload);

  assert.equal(parsed.ok, true);
  assert.equal(parsed.data.slug, cleanFixture.market.slug);
  assert.equal(parsed.data.analysisRun.id, "analysis-run-1");
  assert.equal(parsed.trace.requestId, "req-test-1");
});
