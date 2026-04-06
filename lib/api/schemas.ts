import { z } from "zod";

const nullableStringSchema = z.string().nullable();
const nullableNumberSchema = z.number().nullable();
const nullableBooleanSchema = z.boolean().nullable();

export const embeddedEventSchema = z.object({
  id: nullableStringSchema,
  slug: nullableStringSchema,
  title: nullableStringSchema,
  endDate: nullableStringSchema,
  resolutionSource: nullableStringSchema,
  category: nullableStringSchema,
  negRisk: z.boolean(),
  closed: z.boolean(),
  active: z.boolean(),
  commentsEnabled: nullableBooleanSchema,
  commentCount: z.number().int().nullable()
});

export const marketSchema = z.object({
  id: z.string(),
  conditionId: nullableStringSchema,
  slug: z.string(),
  question: z.string(),
  description: nullableStringSchema,
  resolutionSource: nullableStringSchema,
  endDate: nullableStringSchema,
  startDate: nullableStringSchema,
  umaEndDate: nullableStringSchema,
  closedTime: nullableStringSchema,
  lowerBound: nullableStringSchema,
  upperBound: nullableStringSchema,
  lowerBoundDate: nullableStringSchema,
  upperBoundDate: nullableStringSchema,
  category: nullableStringSchema,
  active: z.boolean(),
  closed: z.boolean(),
  marketType: nullableStringSchema,
  formatType: nullableStringSchema,
  hasReviewedDates: nullableBooleanSchema,
  commentsEnabled: nullableBooleanSchema,
  disqusThread: nullableStringSchema,
  outcomes: z.array(z.string()),
  outcomePrices: z.array(z.number()),
  volume: nullableNumberSchema,
  liquidity: nullableNumberSchema,
  events: z.array(embeddedEventSchema)
});

export const analysisEvidenceSchema = z.object({
  id: z.string(),
  label: z.string(),
  sourceType: z.enum(["market", "event", "comment", "derived"]),
  sourceField: z.string(),
  snippet: z.string(),
  note: z.string()
});

export const analysisFlagSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(["resolution_source", "wording", "dates", "timezone", "comments", "structure"]),
  severity: z.enum(["low", "medium", "high"]),
  evidenceIds: z.array(z.string())
});

export const commentSignalSchema = z.object({
  id: z.string(),
  kind: z.enum(["dispute", "clarification", "procedural"]),
  summary: z.string(),
  evidenceIds: z.array(z.string())
});

export const criticalDateSchema = z.object({
  label: z.string(),
  iso: z.string(),
  display: z.string(),
  detail: z.string()
});

export const marketFactSchema = z.object({
  label: z.string(),
  value: z.string()
});

export const analysisSchema = z.object({
  version: z.string(),
  engineName: z.string(),
  summary: z.string(),
  resolutionSource: nullableStringSchema,
  resolutionSourceSummary: z.string(),
  criticalDatesSummary: z.string(),
  timezoneNotes: z.array(z.string()),
  ambiguityFlags: z.array(analysisFlagSchema),
  commentSignals: z.array(commentSignalSchema),
  criticalDates: z.array(criticalDateSchema),
  marketFacts: z.array(marketFactSchema),
  evidence: z.array(analysisEvidenceSchema),
  riskScore: z.number().int().min(0).max(100),
  riskLevel: z.enum(["low", "medium", "high", "unknown"]),
  confidenceLevel: z.enum(["low", "medium", "high"])
});

export const analyzeRequestSchema = z.object({
  input: z.string().min(1, "A Polymarket URL or slug is required."),
  forceRefresh: z.boolean().optional().default(false)
});

export const analysisRunMetaSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  triggerSource: z.enum(["WEB", "API", "TELEGRAM", "SEED", "MANUAL", "SYNC"]),
  analysisVersion: z.string(),
  engineName: z.string(),
  cached: z.boolean()
});

export const traceSchema = z.object({
  requestId: z.string(),
  analysisRunId: z.string().nullable(),
  generatedAt: z.string(),
  cached: z.boolean().optional(),
  analysisRunIds: z.array(z.string()).optional()
});

export const analyzeDataSchema = z.object({
  slug: z.string(),
  market: marketSchema,
  analysis: analysisSchema,
  analysisRun: analysisRunMetaSchema,
  commentsFetched: z.number().int().min(0)
});

export const analysisRecordDataSchema = z.object({
  slug: z.string(),
  market: marketSchema,
  analysis: analysisSchema,
  analysisRun: analysisRunMetaSchema
});

export const watchKindSchema = z.enum(["risky", "soon"]);

export const watchQuerySchema = z.object({
  kind: watchKindSchema.default("risky"),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const generatedWatchEntrySchema = z.object({
  slug: z.string(),
  question: z.string(),
  kind: watchKindSchema,
  analysisRunId: z.string(),
  analysisCreatedAt: z.string(),
  riskLevel: z.enum(["low", "medium", "high", "unknown"]),
  riskScore: z.number().int().min(0).max(100),
  confidenceLevel: z.enum(["low", "medium", "high"]),
  nextCriticalDate: criticalDateSchema.nullable(),
  reason: z.string(),
  tracked: z.boolean()
});

export const watchDataSchema = z.object({
  kind: watchKindSchema,
  limit: z.number().int().min(1).max(100),
  entries: z.array(generatedWatchEntrySchema)
});

export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    ok: z.literal(true),
    data: dataSchema,
    trace: traceSchema
  });

export const errorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
    details: z.record(z.string(), z.unknown()).optional()
  })
});
