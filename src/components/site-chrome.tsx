import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, LogOut, Shield, User as UserIcon, Compass } from "lucide-react";

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Compass className="h-5 w-5" />
          </div>
          <span className="font-display text-xl tracking-tight">Reclaim</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/browse" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            Browse
          </Link>
          <Link to="/report" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            Report
          </Link>
          {user && (
            <Link to="/my-items" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              My Items
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Admin</span>
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/browse" className="md:hidden">
            <Button variant="ghost" size="icon"><Search className="h-4 w-4" /></Button>
          </Link>
          {user ? (
            <>
              <Link to="/report"><Button size="sm" className="gap-1.5"><PlusCircle className="h-4 w-4" />Report Item</Button></Link>
              <Button variant="ghost" size="icon" onClick={signOut} title="Sign out"><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <Link to="/auth"><Button size="sm" className="gap-1.5"><UserIcon className="h-4 w-4" />Sign in</Button></Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="font-display text-base text-foreground">Reclaim — Lost &amp; Found Community</p>
            <p className="mt-1">Helping good people return what's been misplaced.</p>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} Reclaim. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
