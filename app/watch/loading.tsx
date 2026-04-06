import { Panel } from "@/components/panel";
import { SiteHeader } from "@/components/site-header";

export default function WatchLoading() {
  return (
    <main className="min-h-screen px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <SiteHeader />
        <div className="mt-10 animate-pulse space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="h-64 rounded-[2rem] border border-ink/5 bg-white/60" />
            <div className="h-64 rounded-[2rem] border border-ink/5 bg-white/60" />
          </div>
          <Panel className="h-72 border-ink/5 bg-white/60" />
        </div>
      </div>
    </main>
  );
}

