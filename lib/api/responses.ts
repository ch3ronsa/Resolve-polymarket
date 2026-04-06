import { NextResponse } from "next/server";
import type { z } from "zod";

import { errorResponseSchema } from "@/lib/api/schemas";

export function jsonSuccess<T extends z.ZodTypeAny>({
  schema,
  data,
  trace,
  status = 200
}: {
  schema: T;
  data: unknown;
  trace: {
    requestId: string;
    analysisRunId: string | null;
    generatedAt: string;
    cached?: boolean;
    analysisRunIds?: string[];
  };
  status?: number;
}) {
  const payload = {
    ok: true as const,
    data,
    trace
  };

  const validated = schema.parse(payload);
  return NextResponse.json(validated, { status });
}

export function jsonError({
  requestId,
  code,
  message,
  status,
  details
}: {
  requestId: string;
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
}) {
  const payload = errorResponseSchema.parse({
    ok: false,
    error: {
      code,
      message,
      requestId,
      details
    }
  });

  return NextResponse.json(payload, { status });
}
