export default function RootLoading() {
  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-16 rounded-[2rem] border border-ink/5 bg-white/60" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-[420px] rounded-[2rem] border border-ink/5 bg-white/60" />
          <div className="h-[420px] rounded-[2rem] border border-ink/5 bg-white/60" />
        </div>
      </div>
    </main>
  );
}

