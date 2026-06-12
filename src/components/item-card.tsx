import { Link } from "@tanstack/react-router";
import { MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export interface ItemCardProps {
  id: string;
  name: string;
  category: string;
  type: "lost" | "found";
  status: "active" | "returned" | "removed";
  location: string;
  item_date: string;
  image_url: string | null;
  description: string;
}

export function ItemCard(props: ItemCardProps) {
  const isLost = props.type === "lost";
  return (
    <Link
      to="/items/$id"
      params={{ id: props.id }}
      className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-warm"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {props.image_url ? (
          <img
            src={props.image_url}
            alt={props.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <span className="font-display text-3xl opacity-30">{props.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge
            variant="secondary"
            className={
              isLost
                ? "bg-destructive text-destructive-foreground"
                : "bg-success text-success-foreground"
            }
          >
            {isLost ? "Lost" : "Found"}
          </Badge>
          {props.status === "returned" && (
            <Badge variant="secondary" className="bg-accent text-accent-foreground">Returned</Badge>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 font-display text-lg leading-tight">{props.name}</h3>
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{props.category}</p>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{props.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{props.location}</span>
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(props.item_date), "MMM d, yyyy")}</span>
        </div>
      </div>
    </Link>
  );
}
