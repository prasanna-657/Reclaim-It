import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ItemCard } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export const Route = createFileRoute("/my-items")({
  component: MyItems,
});

function MyItems() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin", redirect: "/my-items" } });
  }, [user, loading, navigate]);

  const { data } = useQuery({
    queryKey: ["my-items", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="font-display text-4xl">My items</h1>
            <p className="mt-1 text-sm text-muted-foreground">Reports you've posted.</p>
          </div>
          <Link to="/report"><Button className="gap-2"><PlusCircle className="h-4 w-4" />Report</Button></Link>
        </div>
        {data && data.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((i) => <ItemCard key={i.id} {...i} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-secondary/40 py-20 text-center">
            <p className="text-muted-foreground">You haven't posted any items yet.</p>
            <Link to="/report" className="mt-3 inline-block text-primary hover:underline">Post your first report →</Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
