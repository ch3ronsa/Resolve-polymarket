import { randomUUID } from "node:crypto";

import { handleAnalyzeRequestPayload } from "@/lib/api/analyze-handler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = randomUUID();
  const payload = await request.json().catch(() => null);
  return handleAnalyzeRequestPayload(payload, requestId);
}
