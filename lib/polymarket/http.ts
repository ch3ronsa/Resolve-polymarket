import { env } from "@/lib/env";
import { PolymarketApiError, isPolymarketApiError } from "@/lib/polymarket/errors";

const retryableStatusCodes = new Set([408, 425, 429, 500, 502, 503, 504]);

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function sleep(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function buildBackoffDelay(attempt: number) {
  return 250 * 2 ** attempt;
}

export async function fetchPolymarketJson<T>({
  path,
  searchParams,
  parse,
  cacheTag,
  allowNotFound = false
}: {
  path: string;
  searchParams?: URLSearchParams;
  parse: (payload: unknown) => T;
  cacheTag?: string;
  allowNotFound?: boolean;
}): Promise<{ data: T; raw: unknown } | null> {
  const url = new URL(path, env.POLYMARKET_API_BASE_URL);

  if (searchParams) {
    url.search = searchParams.toString();
  }

  const endpoint = `${url.pathname}${url.search}`;
  let attempt = 0;

  while (attempt <= env.POLYMARKET_API_RETRY_COUNT) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.POLYMARKET_API_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json"
        },
        signal: controller.signal,
        next: cacheTag
          ? {
              revalidate: 300,
              tags: [cacheTag]
            }
          : {
              revalidate: 300
            }
      });

      if (allowNotFound && response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const details = await response.text().catch(() => undefined);
        throw new PolymarketApiError({
          message: `Polymarket request failed with status ${response.status}.`,
          code: response.status === 404 ? "NOT_FOUND" : "UPSTREAM_ERROR",
          endpoint,
          status: response.status,
          retryable: retryableStatusCodes.has(response.status),
          details
        });
      }

      const payload = await response.json();

      try {
        return {
          data: parse(payload),
          raw: payload
        };
      } catch (error) {
        throw new PolymarketApiError({
          message: "Polymarket returned a response that did not match the expected schema.",
          code: "INVALID_RESPONSE",
          endpoint,
          status: response.status,
          retryable: false,
          details: error
        });
      }
    } catch (error) {
      if (isAbortError(error)) {
        error = new PolymarketApiError({
          message: `Polymarket request timed out after ${env.POLYMARKET_API_TIMEOUT_MS}ms.`,
          code: "TIMEOUT",
          endpoint,
          retryable: true
        });
      } else if (!(error instanceof PolymarketApiError)) {
        error = new PolymarketApiError({
          message: "Polymarket request failed before a valid response was received.",
          code: "NETWORK_ERROR",
          endpoint,
          retryable: true,
          details: error
        });
      }

      if (!isPolymarketApiError(error) || !error.retryable || attempt >= env.POLYMARKET_API_RETRY_COUNT) {
        throw error;
      }

      await sleep(buildBackoffDelay(attempt));
      attempt += 1;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new PolymarketApiError({
    message: "Polymarket request exhausted its retry budget.",
    code: "NETWORK_ERROR",
    endpoint,
    retryable: false
  });
}
