"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { extractPolymarketSlug } from "@/lib/polymarket/slug";

const sampleInputs = [
  {
    label: "Fed sample",
    value: "https://polymarket.com/event/fed-decision-in-october"
  },
  {
    label: "Bitcoin sample",
    value: "will-bitcoin-reach-150k-in-2026"
  }
];

export function MarketUrlForm() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const slug = extractPolymarketSlug(input);

    if (!slug) {
      setError("Enter a valid Polymarket URL or a clean market slug.");
      return;
    }

    setError(null);
    startTransition(() => {
      router.push(`/analyze/${slug}`);
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-ink/10 bg-white/85 p-4 shadow-sm">
        <label htmlFor="market-input" className="sr-only">
          Polymarket market URL or slug
        </label>
        <p className="px-1 text-xs uppercase tracking-[0.24em] text-slate">Polymarket URL or slug</p>
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            id="market-input"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste a Polymarket URL or slug"
            className="min-h-14 flex-1 rounded-[1.25rem] border border-ink/10 bg-mist/70 px-4 text-base text-ink outline-none transition placeholder:text-slate focus:border-signal/30 focus:bg-white"
          />
          <button
            type="submit"
            disabled={isPending}
            className="min-h-14 rounded-[1.25rem] bg-ink px-6 text-sm font-semibold text-white transition hover:bg-ink/92 disabled:cursor-not-allowed disabled:bg-ink/55"
          >
            {isPending ? "Preparing summary..." : "Analyze market"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate">
          {sampleInputs.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setInput(sample.value);
                setError(null);
              }}
              className="rounded-full border border-ink/10 bg-white px-3 py-2 transition hover:border-signal/20 hover:bg-mist"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </form>
      {error ? (
        <p className="rounded-2xl border border-danger/15 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : (
        <p className="text-sm leading-6 text-slate">
          ResolveRadar accepts either the full Polymarket event URL or the market slug by
          itself. You will land on a shareable page that explains what the market appears
          to mean, what still looks uncertain, and which fields triggered the flags.
        </p>
      )}
    </div>
  );
}
