import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ItemCard } from "@/components/item-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import { Search, X, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse Lost & Found Items — Reclaim" },
      { name: "description", content: "Search and filter community-reported lost and found items by category, location, and date." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "lost" | "found">("all");
  const [category, setCategory] = useState<string>("all");
  const [location, setLocation] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["browse", q, type, category, location],
    queryFn: async () => {
      let query = supabase.from("items").select("*").neq("status", "removed").order("created_at", { ascending: false });
      if (type !== "all") query = query.eq("type", type);
      if (category !== "all") query = query.eq("category", category);
      if (location.trim()) query = query.ilike("location", `%${location.trim()}%`);
      if (q.trim()) {
        const term = q.trim().replace(/[%,]/g, "");
        query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
      }
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });

  const hasFilters = q || type !== "all" || category !== "all" || location;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl">Browse the registry</h1>
            <p className="mt-1 text-sm text-muted-foreground">Search by keyword, filter by type, category, location.</p>
          </div>
          <Link to="/report"><Button className="gap-2"><PlusCircle className="h-4 w-4" />Report</Button></Link>
        </div>

        <div className="mb-8 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft md:grid-cols-12">
          <div className="md:col-span-5">
            <Label htmlFor="q" className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Keyword</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Black wallet, iPhone, keys…" className="pl-9" maxLength={100} />
            </div>
          </div>
          <div className="md:col-span-2">
            <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="found">Found</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="loc" className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">Location</Label>
            <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or area" maxLength={100} />
          </div>
          {hasFilters && (
            <div className="md:col-span-12">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setQ(""); setType("all"); setCategory("all"); setLocation(""); }}
                className="gap-1.5"
              >
                <X className="h-3.5 w-3.5" /> Clear filters
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{data.length} {data.length === 1 ? "item" : "items"} found</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((item) => <ItemCard key={item.id} {...item} />)}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-secondary/40 py-20 text-center">
            <p className="text-muted-foreground">No items match your filters.</p>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
