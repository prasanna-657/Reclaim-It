import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Calendar, Tag, Mail, Trash2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/items/$id")({
  component: ItemDetail,
});

function ItemDetail() {
  const { id } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: item, isLoading, refetch } = useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: poster } = useQuery({
    queryKey: ["poster", item?.user_id],
    enabled: !!item?.user_id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", item!.user_id).maybeSingle();
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-5xl flex-1 px-6 py-10"><div className="h-96 animate-pulse rounded-2xl bg-secondary" /></main>
        <SiteFooter />
      </div>
    );
  }
  if (!item) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-5xl flex-1 px-6 py-20 text-center">
          <h1 className="font-display text-3xl">Item not found</h1>
          <Link to="/browse" className="mt-4 inline-block text-primary hover:underline">← Back to browse</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const isOwner = user?.id === item.user_id;
  const canManage = isOwner || isAdmin;
  const isLost = item.type === "lost";

  async function markReturned() {
    const { error } = await supabase.from("items").update({ status: "returned" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked as returned");
    refetch();
  }

  async function remove() {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    navigate({ to: "/browse" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <Link to="/browse" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to browse
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-secondary">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <span className="font-display text-7xl opacity-30">{item.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className={isLost ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground"}>
                {isLost ? "Lost" : "Found"}
              </Badge>
              {item.status === "returned" && <Badge className="bg-accent text-accent-foreground">Returned</Badge>}
            </div>
            <h1 className="mt-3 font-display text-4xl">{item.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Posted by {poster?.full_name || "Member"}</p>

            <div className="mt-6 space-y-3 rounded-xl border border-border bg-card p-5">
              <Detail icon={<Tag className="h-4 w-4" />} label="Category" value={item.category} />
              <Detail icon={<MapPin className="h-4 w-4" />} label="Location" value={item.location} />
              <Detail icon={<Calendar className="h-4 w-4" />} label={isLost ? "Lost on" : "Found on"} value={format(new Date(item.item_date), "MMMM d, yyyy")} />
            </div>

            <h2 className="mt-6 font-display text-lg">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.description}</p>

            <div className="mt-6 rounded-xl border border-border bg-secondary/50 p-5">
              <h3 className="font-display text-base">Contact</h3>
              {user ? (
                <p className="mt-2 inline-flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="font-medium">{item.contact_info}</span>
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  <Link to="/auth" search={{ redirect: `/items/${id}` }} className="font-medium text-primary underline underline-offset-4">Sign in</Link> to view contact details.
                </p>
              )}
            </div>

            {canManage && (
              <div className="mt-6 flex flex-wrap gap-2">
                {item.status === "active" && (
                  <Button onClick={markReturned} variant="outline" className="gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Mark as returned
                  </Button>
                )}
                <Button onClick={remove} variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
