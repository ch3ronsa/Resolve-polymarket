import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex flex-col gap-4 rounded-[2rem] border border-ink/10 bg-white/70 px-5 py-4 shadow-calm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/" className="font-serif text-2xl text-ink">
          ResolveRadar
        </Link>
        <p className="mt-1 text-sm text-slate">
          Resolution summaries for Polymarket markets, with no trading framing.
        </p>
      </div>
      <nav className="flex flex-wrap items-center gap-2 text-sm text-slate">
        <Link
          href="/"
          className="rounded-full border border-ink/10 bg-white px-4 py-2 transition hover:border-signal/20 hover:bg-mist"
        >
          Home
        </Link>
        <Link
          href="/watch"
          className="rounded-full border border-ink/10 bg-white px-4 py-2 transition hover:border-signal/20 hover:bg-mist"
        >
          Watch
        </Link>
        <Link
          href="/api/health"
          className="rounded-full border border-ink/10 bg-white px-4 py-2 transition hover:border-signal/20 hover:bg-mist"
        >
          API health
        </Link>
      </nav>
    </header>
  );
}

