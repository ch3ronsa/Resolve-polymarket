export type PolymarketErrorCode =
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "NOT_FOUND"
  | "UPSTREAM_ERROR"
  | "INVALID_RESPONSE";

export class PolymarketApiError extends Error {
  code: PolymarketErrorCode;
  endpoint: string;
  status: number | null;
  retryable: boolean;
  details?: unknown;

  constructor(options: {
    message: string;
    code: PolymarketErrorCode;
    endpoint: string;
    status?: number | null;
    retryable: boolean;
    details?: unknown;
  }) {
    super(options.message);
    this.name = "PolymarketApiError";
    this.code = options.code;
    this.endpoint = options.endpoint;
    this.status = options.status ?? null;
    this.retryable = options.retryable;
    this.details = options.details;
  }
}

export function isPolymarketApiError(error: unknown): error is PolymarketApiError {
  return error instanceof PolymarketApiError;
}

