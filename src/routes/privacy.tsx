import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import {
  Moon,
  Sun,
  ArrowLeft,
  Loader2,
  Shield,
  ChevronRight,
  Clock,
  BookOpen,
  Mail,
  Lock,
  Eye,
  Database,
} from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — PassAsistant" },
      {
        name: "description",
        content:
          "Privacy Policy for PassAsistant English exam preparation website. Detailed terms about information collection, cookies, and Google AdSense policies.",
      },
    ],
  }),
  component: PrivacyPage,
});

const DEFAULT_CONTENT = `# Privacy Policy

Last updated: ${new Date().toLocaleDateString()}

PassAsistant ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by PassAsistant.

## 1. Information We Collect
We collect information you provide directly to us when you create an account, practice writing or speaking tasks, or communicate with us.

## 2. Cookies and Tracking Technologies
We use cookies to enhance your experience, analyze usage, and personalize content. We may also display advertisements served by Google AdSense.

### Google DoubleClick DART Cookie
Google is one of the third-party vendors on our site. It uses cookies, known as DART cookies, to serve ads to our site visitors based on their visit to PassAsistant and other sites on the internet. Visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL: https://policies.google.com/technologies/ads

## 3. Contact Us
If you have any questions about this Privacy Policy, please contact us at support@prepai.com.`;

/* ------------------------------------------------------------------ */
/*  Section icon mapping                                              */
/* ------------------------------------------------------------------ */
const SECTION_ICONS: Record<number, React.ElementType> = {
  0: Shield,
  1: Database,
  2: Eye,
  3: Lock,
  4: Mail,
};

/* ------------------------------------------------------------------ */
/*  Main Page Component                                               */
/* ------------------------------------------------------------------ */
export function PrivacyPage() {
  const { theme, toggle } = useTheme();
  const [title, setTitle] = useState("Privacy Policy");
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("");
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    async function loadPage() {
      try {
        const { data, error } = await (supabase as any)
          .from("site_pages")
          .select("*")
          .eq("slug", "privacy")
          .maybeSingle();

        if (data && !error) {
          setTitle(data.title);
          setContent(data.content);
        } else {
          const localContent = localStorage.getItem("prepai_page_content_privacy");
          const localTitle = localStorage.getItem("prepai_page_title_privacy");
          if (localContent) {
            setContent(localContent);
            setTitle(localTitle || "Privacy Policy");
          }
        }
      } catch (err) {
        console.warn("Failed to load page from database/localStorage:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPage();
  }, []);

  // Fade-in after loading
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading]);

  // Extract TOC headings from content
  const tocItems = useMemo(() => {
    const headings: { id: string; label: string; level: number }[] = [];
    const lines = content.split("\n");
    let sectionNum = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) {
        sectionNum++;
        const text = trimmed.substring(3);
        const id = `section-${text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}`;
        headings.push({ id, label: text, level: 2 });
      } else if (trimmed.startsWith("### ")) {
        const text = trimmed.substring(4);
        const id = `section-${text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}`;
        headings.push({ id, label: text, level: 3 });
      }
    }
    return headings;
  }, [content]);

  // Reading time estimate
  const readingTime = useMemo(() => {
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 220));
  }, [content]);

  // IntersectionObserver for active TOC tracking
  useEffect(() => {
    if (loading || tocItems.length === 0) return;

    const cb: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      }
    };

    observerRef.current = new IntersectionObserver(cb, {
      rootMargin: "-80px 0px -60% 0px",
      threshold: 0.1,
    });

    const timer = setTimeout(() => {
      for (const item of tocItems) {
        const el = document.getElementById(item.id);
        if (el) observerRef.current?.observe(el);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [loading, tocItems]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const lastUpdated = useMemo(() => {
    const match = content.match(/Last updated:\s*(.+)/i);
    if (match) return match[1].trim();
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [content]);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col font-sans scroll-smooth">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-lg font-bold tracking-tight transition-colors">
              Prep
              <span className="text-accent group-hover:brightness-110 transition-all">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="sm" asChild className="rounded-full">
              <Link to="/">
                <ArrowLeft className="size-3.5 mr-1.5" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Loading State ───────────────────────────────────── */}
      {loading ? (
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-accent/20 blur-xl animate-pulse" />
            <Loader2 className="size-10 animate-spin text-accent relative" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Loading Privacy Policy…</p>
        </main>
      ) : (
        <div
          className={`flex-1 transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {/* ── Hero Section ──────────────────────────────────── */}
          <section className="relative overflow-hidden border-b border-border">
            {/* gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-background to-accent/5 dark:from-accent/12 dark:via-background dark:to-accent/6" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-accent/4 blur-2xl translate-y-1/2 -translate-x-1/4" />

            <div className="relative max-w-6xl mx-auto px-6 pt-10 pb-14 md:pt-14 md:pb-20">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
                <Link to="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
                <ChevronRight className="size-3 opacity-50" />
                <span className="text-foreground font-medium">Privacy Policy</span>
              </nav>

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="flex items-start gap-5">
                  {/* Shield icon */}
                  <div className="hidden sm:flex shrink-0 size-16 md:size-20 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20 shadow-lg shadow-accent/5">
                    <Shield className="size-8 md:size-10 text-accent" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                      Privacy
                      <span className="text-accent"> Policy</span>
                    </h1>
                    <p className="mt-2 text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed">
                      We care about your privacy. Learn how PassAsistant collects, uses, and protects your
                      personal information.
                    </p>
                  </div>
                </div>

                {/* Meta badges */}
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-card border border-border text-muted-foreground shadow-sm">
                    <Clock className="size-3.5 text-accent" />
                    {readingTime} min read
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-card border border-border text-muted-foreground shadow-sm">
                    <BookOpen className="size-3.5 text-accent" />
                    Updated {lastUpdated}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Content + TOC Grid ────────────────────────────── */}
          <div className="max-w-6xl mx-auto px-6 py-10 md:py-16">
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
              {/* ── Sticky TOC Sidebar (desktop) ───────────────── */}
              {tocItems.length > 0 && (
                <aside className="hidden lg:block w-64 shrink-0">
                  <div className="sticky top-24">
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-4">
                      On this page
                    </p>
                    <nav className="flex flex-col gap-0.5">
                      {tocItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => scrollTo(item.id)}
                          className={`text-left text-[13px] leading-snug py-1.5 transition-all duration-200 border-l-2 ${
                            item.level === 3 ? "pl-6" : "pl-4"
                          } ${
                            activeSection === item.id
                              ? "border-accent text-accent font-semibold"
                              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </nav>
                  </div>
                </aside>
              )}

              {/* ── Main Content Card ──────────────────────────── */}
              <article className="flex-1 min-w-0">
                <div className="bg-card border border-border rounded-2xl shadow-sm shadow-black/[0.03] dark:shadow-black/20 p-6 sm:p-8 md:p-10 lg:p-12">
                  <SimpleMarkdown content={content} />
                </div>

                {/* ── CTA Section ──────────────────────────────── */}
                <div className="mt-10 rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/5 via-accent/8 to-accent/5 dark:from-accent/10 dark:via-accent/14 dark:to-accent/10 p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="flex items-center justify-center size-14 rounded-xl bg-accent/15 border border-accent/20 shrink-0">
                    <Mail className="size-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      Questions about privacy?
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We're happy to help explain any part of our privacy practices. Reach out to
                      our team anytime.
                    </p>
                  </div>
                  <Button asChild className="rounded-full px-6 shrink-0">
                    <Link to="/contact">
                      Contact Us
                      <ChevronRight className="size-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </article>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-border mt-auto bg-surface/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} PassAsistant. All rights reserved.
            </div>
            <nav className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link to="/terms" as any className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link to="/about" as any className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link to="/contact" as any className="hover:text-foreground transition-colors">
                Contact
              </Link>
              <Link to="/portfolio" as any className="hover:text-foreground transition-colors">
                Creator
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Markdown Renderer                                                 */
/* ------------------------------------------------------------------ */
let h2Counter = 0;

function SimpleMarkdown({ content }: { content: string }) {
  if (!content) return null;
  h2Counter = 0;
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-6">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        /* ── h1 ────────────────────────────────────────── */
        if (trimmed.startsWith("# ")) {
          return (
            <h1
              key={idx}
              className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground pb-4 mb-2"
            >
              <span className="bg-gradient-to-r from-foreground via-foreground to-accent bg-clip-text">
                {parseInline(trimmed.substring(2))}
              </span>
              <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-accent to-accent/30" />
            </h1>
          );
        }

        /* ── h2 ────────────────────────────────────────── */
        if (trimmed.startsWith("## ")) {
          h2Counter++;
          const text = trimmed.substring(3);
          const id = `section-${text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")}`;
          const num = String(h2Counter).padStart(2, "0");
          const IconComp = SECTION_ICONS[h2Counter] ?? Shield;

          return (
            <div key={idx} id={id} className="scroll-mt-24 pt-8 first:pt-0">
              <div className="flex items-start gap-4 mb-4 border-l-[3px] border-accent pl-5 -ml-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl md:text-4xl font-black text-accent/20 dark:text-accent/25 leading-none select-none">
                    {num}
                  </span>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight">
                      {parseInline(text)}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        /* ── h3 ────────────────────────────────────────── */
        if (trimmed.startsWith("### ")) {
          const text = trimmed.substring(4);
          const id = `section-${text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")}`;
          return (
            <h3
              key={idx}
              id={id}
              className="scroll-mt-24 flex items-center gap-2.5 text-lg font-semibold text-foreground mt-6 mb-3"
            >
              <span className="flex items-center justify-center size-6 rounded-md bg-accent/10 text-accent">
                <ChevronRight className="size-3.5" />
              </span>
              {parseInline(text)}
            </h3>
          );
        }

        /* ── Lists ─────────────────────────────────────── */
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split(/\n[-*]\s+/);
          return (
            <ul key={idx} className="space-y-3 my-4 text-foreground/80 text-base leading-relaxed">
              {items.map((item, itemIdx) => {
                let cleanItem = item;
                if (itemIdx === 0) {
                  cleanItem = item.replace(/^[-*]\s+/, "");
                }
                return (
                  <li key={itemIdx} className="flex items-start gap-3">
                    <span className="mt-2 size-1.5 rounded-full bg-accent shrink-0" />
                    <span>{parseInline(cleanItem)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        /* ── Paragraph ─────────────────────────────────── */
        const lines = trimmed.split("\n");
        return (
          <p
            key={idx}
            className="text-foreground/75 dark:text-foreground/70 text-base leading-[1.8] max-w-[68ch]"
          >
            {lines.map((line, lineIdx) => (
              <span key={lineIdx}>
                {lineIdx > 0 && <br />}
                {parseInline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline parser                                                     */
/* ------------------------------------------------------------------ */
function parseInline(text: string) {
  const inlineRegex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
  const tokens = text.split(inlineRegex);

  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("[") && token.includes("](")) {
      const match = token.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const [_, label, url] = match;
        if (url.startsWith("http")) {
          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent font-medium underline decoration-accent/30 underline-offset-2 hover:decoration-accent transition-colors"
            >
              {label}
            </a>
          );
        } else {
          return (
            <Link
              key={index}
              to={url as any}
              className="text-accent font-medium underline decoration-accent/30 underline-offset-2 hover:decoration-accent transition-colors"
            >
              {label}
            </Link>
          );
        }
      }
    }
    return token;
  });
}
