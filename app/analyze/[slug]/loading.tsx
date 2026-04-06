import { Panel } from "@/components/panel";
import { SiteHeader } from "@/components/site-header";

export default function AnalyzeLoading() {
  return (
    <main className="min-h-screen px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <SiteHeader />
        <div className="mt-8 animate-pulse space-y-6">
          <div className="h-10 w-48 rounded-full bg-white/70" />
          <Panel className="space-y-5">
            <div className="h-12 w-3/4 rounded-2xl bg-white/80" />
            <div className="h-24 rounded-3xl bg-white/70" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-48 rounded-3xl bg-white/70" />
              <div className="h-48 rounded-3xl bg-white/70" />
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}

