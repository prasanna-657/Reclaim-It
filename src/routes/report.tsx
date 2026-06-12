import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { toast } from "sonner";
import { Upload, ImagePlus } from "lucide-react";

export const Route = createFileRoute("/report")({
  component: ReportPage,
});

const schema = z.object({
  type: z.enum(["lost", "found"]),
  name: z.string().trim().min(1).max(120),
  category: z.string().min(1).max(50),
  description: z.string().trim().min(10, "Add at least 10 characters").max(2000),
  location: z.string().trim().min(1).max(150),
  item_date: z.string().min(1),
  contact_info: z.string().trim().min(3, "Provide a way to reach you").max(200),
});

function ReportPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<"lost" | "found">("lost");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin", redirect: "/report" } });
  }, [user, loading, navigate]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      type,
      name: fd.get("name"),
      category,
      description: fd.get("description"),
      location: fd.get("location"),
      item_date: fd.get("item_date"),
      contact_info: fd.get("contact_info"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("item-images").upload(path, file);
        if (upErr) throw upErr;
        image_url = supabase.storage.from("item-images").getPublicUrl(path).data.publicUrl;
      }
      const { data, error } = await supabase
        .from("items")
        .insert({ ...parsed.data, image_url, user_id: user.id })
        .select("id").single();
      if (error) throw error;
      toast.success("Item posted");
      navigate({ to: "/items/$id", params: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post item");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1 className="font-display text-4xl">Report an item</h1>
        <p className="mt-1 text-sm text-muted-foreground">Fill in the details below. A clear photo helps reunite items faster.</p>

        <div className="mt-6 inline-flex rounded-lg border border-border bg-card p-1">
          {(["lost", "found"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={
                "rounded-md px-5 py-2 text-sm font-medium capitalize transition-colors " +
                (type === t
                  ? (t === "lost" ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground")
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              I {t === "lost" ? "lost" : "found"} an item
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div>
            <Label className="mb-2 block text-sm">Photo (optional)</Label>
            <label className="flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-secondary/40 transition-colors hover:bg-secondary">
              {preview ? (
                <img src={preview} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm">Click to upload an image (max 5MB)</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Item name</Label>
              <Input id="name" name="name" required maxLength={120} placeholder="Black leather wallet" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" required maxLength={150} placeholder="Central Library, 2nd floor" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item_date">Date {type === "lost" ? "lost" : "found"}</Label>
              <Input id="item_date" name="item_date" type="date" required max={new Date().toISOString().slice(0, 10)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required minLength={10} maxLength={2000} rows={4} placeholder="Brand, color, distinguishing marks, contents…" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact_info">Contact information</Label>
            <Input id="contact_info" name="contact_info" required maxLength={200} placeholder="Email or phone (visible only to signed-in users)" />
            <p className="text-xs text-muted-foreground">Only signed-in members can view this.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Link to="/browse"><Button type="button" variant="ghost">Cancel</Button></Link>
            <Button type="submit" disabled={submitting} className="gap-2">
              <Upload className="h-4 w-4" /> {submitting ? "Posting…" : "Post report"}
            </Button>
          </div>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
