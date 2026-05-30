import { Link, useRouterState } from "@tanstack/react-router";
import {
  Brain,
  LayoutDashboard,
  PenLine,
  GraduationCap,
  Moon,
  Sun,
  LogOut,
  Mic,
  Headphones,
  Gamepad2,
  BookOpen,
  Shield,
  Settings,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/writing", label: "AI Writing", icon: PenLine },
  { to: "/speaking", label: "AI Speaking", icon: Mic },
  { to: "/examiner", label: "Live Examiner", icon: Headphones },
  { to: "/vocabulary", label: "Word Arena", icon: Gamepad2 },
  { to: "/exams", label: "Exams", icon: GraduationCap },
  { to: "/helpful", label: "Helpful Sources", icon: BookOpen },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  const activeNav = [...nav];
  if (isAdmin) {
    activeNav.push({ to: "/admin", label: "Admin Panel", icon: Shield });
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 px-2 mb-8">
          <span className="text-lg font-bold tracking-tight">
            Pass<span className="text-accent">Asistant</span>
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {activeNav.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <Button variant="ghost" size="sm" onClick={toggle} className="justify-start">
            {theme === "dark" ? <Sun className="size-4 mr-2" /> : <Moon className="size-4 mr-2" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
          {user && (
            <Button variant="ghost" size="sm" onClick={signOut} className="justify-start">
              <LogOut className="size-4 mr-2" />
              Sign out
            </Button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">
              Pass<span className="text-accent">Asistant</span>
            </span>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggle}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </header>
        <nav className="lg:hidden flex gap-1 px-3 py-2 border-b border-border bg-surface overflow-x-auto">
          {activeNav.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
                  active ? "bg-accent/10 text-accent" : "text-muted-foreground"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
          {user && (
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          )}
        </nav>
        <main className="flex-1">{children}</main>

        <footer className="border-t border-border bg-surface/30">
          <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>© {new Date().getFullYear()} PassAsistant</div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link to="/about" className="hover:text-foreground transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">
                Contact Us
              </Link>
              <Link to="/portfolio" className="hover:text-foreground transition-colors">
                Creator
              </Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
            <div>Built for serious learners.</div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div className="flex-1 min-w-0">
        {eyebrow && (
          <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-2 flex items-center gap-2">
            <Brain className="size-3.5" />
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {children && <div className="shrink-0 flex items-center gap-2">{children}</div>}
    </div>
  );
}
