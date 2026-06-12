import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin", redirect: "/admin" } });
  }, [user, loading, navigate]);

  const { data: items, refetch } = useQuery({
    queryKey: ["admin-items"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl flex-1 px-6 py-20 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-3xl">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You're signed in but don't have admin privileges. Ask an existing admin to grant you the role.
          </p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">← Home</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  async function removeItem(id: string) {
    if (!confirm("Remove this item?")) return;
    const { error } = await supabase.from("items").update({ status: "removed" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Item removed");
    refetch();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <h1 className="font-display text-4xl">Admin dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Moderate posts and monitor activity.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Stat label="Total items" value={items?.length ?? 0} />
          <Stat label="Active reports" value={items?.filter((i) => i.status === "active").length ?? 0} />
          <Stat label="Members" value={users?.length ?? 0} />
        </div>

        <h2 className="mt-12 font-display text-2xl">Reports</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Posted</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items?.map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link to="/items/$id" params={{ id: i.id }} className="font-medium hover:underline">{i.name}</Link>
                    <p className="text-xs text-muted-foreground">{i.category} · {i.location}</p>
                  </td>
                  <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{i.type}</Badge></td>
                  <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{i.status}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(i.created_at), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3 text-right">
                    {i.status !== "removed" && (
                      <Button size="sm" variant="ghost" onClick={() => removeItem(i.id)} className="gap-1.5 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {items?.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No items yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 className="mt-12 font-display text-2xl">Members</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(u.created_at), "MMM d, yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
    </div>
  );
}
