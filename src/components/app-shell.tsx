import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
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
  ChevronLeft,
  MoreHorizontal,
  User,
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
  { to: "/profile", label: "Profile Settings", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  // Responsive and collapsible states
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  const [showMore, setShowMore] = useState(false);

  const toggleSidebar = () => {
    const nextValue = !collapsed;
    setCollapsed(nextValue);
    localStorage.setItem("sidebar-collapsed", String(nextValue));
  };

  const activeNav = [...nav];
  if (isAdmin) {
    activeNav.push({ to: "/admin", label: "Admin Panel", icon: Shield });
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  // Determine top-4 bottom nav items and remaining "more" items for mobile bottom nav
  const quickAccessItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/writing", label: "Writing", icon: PenLine },
    { to: "/speaking", label: "Speaking", icon: Mic },
    { to: "/vocabulary", label: "Word Arena", icon: Gamepad2 },
  ];

  const moreNavItems = activeNav.filter(
    (item) => !quickAccessItems.some((q) => q.to === item.to)
  );

  return (
    <div className="min-h-dvh bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <aside 
        className={`hidden lg:flex shrink-0 flex-col border-r border-border/80 bg-surface/75 backdrop-blur-xl px-4 py-6 transition-all duration-300 glass ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between px-2 mb-8">
          <Link to={user ? "/dashboard" : "/"} className={`flex items-center gap-2 transition-all ${collapsed ? "mx-auto" : ""}`}>
            <div className="size-8 rounded-lg bg-gradient-to-tr from-accent to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-accent/25">
              P
            </div>
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight bg-clip-text text-foreground">
                Pass<span className="text-accent">Assist</span>
              </span>
            )}
          </Link>
        </div>

        {/* User profile card in desktop sidebar */}
        {user && (
          <Link
            to="/profile"
            className={`mb-6 flex items-center gap-3 hover:bg-muted/40 transition-colors duration-200 cursor-pointer ${
              collapsed ? "justify-center" : "p-3 rounded-xl bg-muted/40 border border-border/40"
            }`}
          >
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="size-9 rounded-full object-cover border border-accent/20 shadow-sm"
                title={user.email}
              />
            ) : (
              <div className="size-9 rounded-full bg-gradient-to-tr from-accent to-violet-500 flex items-center justify-center text-white font-semibold text-sm shadow-inner cursor-help" title={user.email}>
                {user.user_metadata?.full_name 
                  ? user.user_metadata.full_name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase() 
                  : user.email?.split('@')[0]?.substring(0, 2).toUpperCase() || 'US'}
              </div>
            )}
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {user.email}
                </span>
              </div>
            )}
          </Link>
        )}

        <nav className="flex flex-col gap-1.5">
          {activeNav.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover-glow hover:bg-muted/40 ${
                  active
                    ? "bg-accent/10 text-accent font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                } ${collapsed ? "justify-center" : ""}`}
              >
                {active && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full bg-accent shadow-[0_0_8px_oklch(var(--accent))]" />
                )}
                <item.icon className={`size-4.5 transition-transform duration-200 group-hover:scale-110 ${active ? "text-accent" : ""}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-border/50">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleSidebar} 
            className={`justify-start rounded-xl ${collapsed ? "justify-center px-0" : ""}`}
          >
            <ChevronLeft className={`size-4 transition-transform duration-300 ${collapsed ? "rotate-180" : "mr-2"}`} />
            {!collapsed && "Collapse"}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggle} 
            className={`justify-start rounded-xl ${collapsed ? "justify-center px-0" : ""}`}
          >
            {theme === "dark" ? (
              <Sun className={`size-4 text-amber-500 ${collapsed ? "" : "mr-2"}`} />
            ) : (
              <Moon className={`size-4 text-indigo-500 ${collapsed ? "" : "mr-2"}`} />
            )}
            {!collapsed && (theme === "dark" ? "Light mode" : "Dark mode")}
          </Button>
          {user && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut} 
              className={`justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl ${collapsed ? "justify-center px-0" : ""}`}
            >
              <LogOut className={`size-4 ${collapsed ? "" : "mr-2"}`} />
              {!collapsed && "Sign out"}
            </Button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bottom-nav-safe lg:pb-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-40">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <div className="size-7 rounded bg-gradient-to-tr from-accent to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              P
            </div>
            <span className="text-base font-bold tracking-tight">
              Pass<span className="text-accent">Assist</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} className="size-9 rounded-full">
              {theme === "dark" ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4 text-indigo-500" />}
            </Button>
            {user && (
              <Link 
                to="/profile"
                className="size-8 rounded-full overflow-hidden flex items-center justify-center cursor-pointer shadow-inner border border-accent/15"
              >
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="size-full object-cover" />
                ) : (
                  <div className="size-full bg-gradient-to-tr from-accent to-violet-500 flex items-center justify-center text-white font-semibold text-xs">
                    {user.user_metadata?.full_name 
                      ? user.user_metadata.full_name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase() 
                      : user.email?.split('@')[0]?.substring(0, 2).toUpperCase() || 'US'}
                  </div>
                )}
              </Link>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 animate-fade-in">
          {children}
        </main>

        {/* Mobile bottom nav bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass border-t border-border/70 py-1.5 px-2 flex items-center justify-around bg-surface/85 backdrop-blur-lg">
          {quickAccessItems.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-150 active:scale-90 ${
                  active ? "text-accent font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className={`relative p-1 rounded-full ${active ? "bg-accent/10" : ""}`}>
                  <item.icon className="size-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-150 active:scale-90 ${
              showMore ? "text-accent font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`p-1 rounded-full ${showMore ? "bg-accent/10" : ""}`}>
              <MoreHorizontal className="size-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">More</span>
          </button>
        </nav>

        {/* Mobile "More" Drawer Slide-up Sheet */}
        {showMore && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-55 transition-opacity duration-300 animate-fade-in lg:hidden"
              onClick={() => setShowMore(false)}
            />
            <div 
              className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/80 rounded-t-2xl z-60 px-6 pt-4 pb-8 max-h-[80vh] overflow-y-auto animate-fade-in-up lg:hidden"
            >
              <div className="w-12 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-6" onClick={() => setShowMore(false)} />
              
              <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider">More Resources</h3>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                {moreNavItems.map((item) => {
                  const active = path === item.to || path.startsWith(item.to + "/");
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setShowMore(false)}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-150 active:scale-95 ${
                        active
                          ? "bg-accent/15 border-accent/25 text-accent font-semibold"
                          : "bg-surface/50 border-border/50 hover:bg-muted text-foreground"
                      }`}
                    >
                      <item.icon className="size-5 text-accent/80" />
                      <span className="text-[11px] text-center font-medium leading-tight truncate w-full">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-border/50 pt-4 flex flex-col gap-2.5">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => { toggle(); setShowMore(false); }} 
                  className="w-full justify-start rounded-xl h-11"
                >
                  {theme === "dark" ? <Sun className="size-4 mr-3 text-amber-500" /> : <Moon className="size-4 mr-3 text-indigo-500" />}
                  Theme: {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </Button>
                {user && (
                  <Button 
                    variant="destructive" 
                    size="lg" 
                    onClick={() => { signOut(); setShowMore(false); }} 
                    className="w-full justify-start rounded-xl h-11"
                  >
                    <LogOut className="size-4 mr-3" />
                    Sign out
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="border-t border-border bg-surface/30">
          <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>© {new Date().getFullYear()} PassAssist</div>
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
      <div className="flex-1 min-w-0 animate-fade-in">
        {eyebrow && (
          <div className="text-xs font-bold uppercase tracking-widest text-accent mb-2 flex items-center gap-2">
            <Brain className="size-3.5 animate-pulse" />
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-heading bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          {title}
        </h1>
        {description && <p className="mt-2 text-muted-foreground max-w-2xl text-sm leading-relaxed">{description}</p>}
      </div>
      {children && <div className="shrink-0 flex items-center gap-2 self-start md:self-end mt-2 md:mt-0">{children}</div>}
    </div>
  );
}
