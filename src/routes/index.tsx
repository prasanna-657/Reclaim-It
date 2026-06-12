import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ItemCard } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const [lost, found, returned] = await Promise.all([
        supabase.from("items").select("id", { count: "exact", head: true }).eq("type", "lost").eq("status", "active"),
        supabase.from("items").select("id", { count: "exact", head: true }).eq("type", "found").eq("status", "active"),
        supabase.from("items").select("id", { count: "exact", head: true }).eq("status", "returned"),
      ]);
      return { lost: lost.count ?? 0, found: found.count ?? 0, returned: returned.count ?? 0 };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["home-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("items")
        .select("*")
        .neq("status", "removed")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero — bento grid */}
        <section className="mx-auto max-w-7xl px-6 pt-12 pb-10">
          <div className="grid gap-4 md:grid-cols-6 md:grid-rows-[auto_auto] lg:gap-5">
            {/* Big hero cell */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-secondary via-background to-accent/30 p-8 shadow-soft md:col-span-4 md:row-span-2 md:p-12">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3" /> A community of returners
              </span>
              <h1 className="mt-6 max-w-2xl font-display text-4xl leading-[1.1] md:text-6xl">
                Lost something? Found something? <span className="italic text-primary">Reclaim it.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
                A trusted local registry for misplaced belongings. Post a report in
                under a minute. Reach the owner securely.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/report">
                  <Button size="lg" className="gap-2"><PlusCircle className="h-4 w-4" />Report an item</Button>
                </Link>
                <Link to="/browse">
                  <Button size="lg" variant="outline" className="gap-2"><Search className="h-4 w-4" />Browse listings</Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft md:col-span-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Currently Lost</p>
              <p className="mt-2 font-display text-5xl text-foreground">{stats?.lost ?? "—"}</p>
              <p className="mt-1 text-sm text-muted-foreground">Active reports waiting</p>
            </div>
            <div className="rounded-2xl border border-border bg-primary p-6 text-primary-foreground shadow-soft md:col-span-2">
              <p className="text-xs uppercase tracking-wider opacity-80">Items Found</p>
              <p className="mt-2 font-display text-5xl">{stats?.found ?? "—"}</p>
              <p className="mt-1 text-sm opacity-80">Awaiting their owner</p>
            </div>
          </div>

          {/* Secondary bento row */}
          <div className="mt-4 grid gap-4 md:grid-cols-6 lg:gap-5">
            <div className="rounded-2xl border border-border bg-accent/30 p-6 md:col-span-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-display text-lg">Secure contact</h3>
              <p className="mt-1 text-sm text-muted-foreground">Owners are reached through verified accounts — no public emails.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Reunited</p>
              <p className="mt-2 font-display text-4xl text-success">{stats?.returned ?? 0}</p>
              <p className="mt-1 text-sm text-muted-foreground">items returned to owners</p>
            </div>
            <Link to="/browse" className="group flex items-center justify-between rounded-2xl border border-border bg-foreground p-6 text-background transition-colors hover:bg-foreground/90 md:col-span-2">
              <div>
                <p className="font-display text-lg">Search the registry</p>
                <p className="mt-1 text-sm opacity-80">Filter by category, location, date.</p>
              </div>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* Recent items */}
        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl">Recent listings</h2>
              <p className="mt-1 text-sm text-muted-foreground">Fresh from the community.</p>
            </div>
            <Link to="/browse" className="text-sm font-medium text-primary hover:underline">View all →</Link>
          </div>
          {recent && recent.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((item) => <ItemCard key={item.id} {...item} />)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-secondary/40 py-16 text-center">
              <p className="text-muted-foreground">No items posted yet. Be the first to <Link to="/report" className="text-primary underline underline-offset-4">report one</Link>.</p>
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="font-display text-3xl">How it works</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { n: "01", t: "Post a report", d: "Lost something? Found something? Add a photo, location, and a few details." },
              { n: "02", t: "Get matched", d: "Browse and search the registry. Filters help you narrow down quickly." },
              { n: "03", t: "Reconnect securely", d: "Message verified members. Mark as returned when reunited." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <p className="font-display text-2xl text-accent">{s.n}</p>
                <h3 className="mt-3 font-display text-xl">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
