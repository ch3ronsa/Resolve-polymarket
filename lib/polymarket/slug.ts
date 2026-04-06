const acceptedHosts = new Set(["polymarket.com", "www.polymarket.com"]);

export function normalizeSlug(value: string) {
  const candidate = value.trim().toLowerCase().replace(/\/+$/, "");
  return /^[a-z0-9][a-z0-9-]*$/.test(candidate) ? candidate : null;
}

export function extractPolymarketSlug(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);

    if (!acceptedHosts.has(url.hostname)) {
      return null;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    const eventIndex = segments.findIndex((segment) => segment === "event");

    if (eventIndex >= 0 && segments[eventIndex + 1]) {
      return normalizeSlug(segments[eventIndex + 1]);
    }

    const tailSegment = segments.at(-1);
    return tailSegment ? normalizeSlug(tailSegment) : null;
  } catch {
    return normalizeSlug(trimmed);
  }
}

export function buildPolymarketUrl(slug: string) {
  return `https://polymarket.com/event/${slug}`;
}

