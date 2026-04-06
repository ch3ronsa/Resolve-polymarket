import test from "node:test";
import assert from "node:assert/strict";

import { extractPolymarketSlug } from "@/lib/polymarket/slug";

test("extractPolymarketSlug accepts a raw slug", () => {
  assert.equal(
    extractPolymarketSlug("will-the-fed-cut-rates"),
    "will-the-fed-cut-rates"
  );
});

test("extractPolymarketSlug parses a full Polymarket event URL", () => {
  assert.equal(
    extractPolymarketSlug("https://polymarket.com/event/will-the-fed-cut-rates"),
    "will-the-fed-cut-rates"
  );
});

test("extractPolymarketSlug rejects unrelated hosts", () => {
  assert.equal(
    extractPolymarketSlug("https://example.com/event/will-the-fed-cut-rates"),
    null
  );
});

test("extractPolymarketSlug normalizes casing and trailing slashes", () => {
  assert.equal(
    extractPolymarketSlug("https://polymarket.com/event/WILL-THE-FED-CUT-RATES///"),
    "will-the-fed-cut-rates"
  );
});
