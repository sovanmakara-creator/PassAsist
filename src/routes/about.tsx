import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import {
  Moon,
  Sun,
  ArrowLeft,
  Loader2,
  Info,
  Users,
  Target,
  Sparkles,
  ChevronRight,
  Clock,
  BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — PassAsistant" },
      {
        name: "description",
        content:
          "Learn more about PassAsistant and our mission to provide affordable, high-quality AI-powered English exam preparation.",
      },
    ],
  }),
  component: AboutPage,
});

const DEFAULT_CONTENT = `# About PassAsistant

PassAsistant is an advanced AI-powered English proficiency exam preparation platform designed for serious learners preparing for IELTS, TOEFL, and TOEIC tests.

## Our Mission
Our mission is to democratize high-quality test prep. Private exam tutoring is expensive and inaccessible to many. PassAsistant leverages state-of-the-art AI to provide immediate, detailed feedback on writing, speaking, listening, and reading skills at a fraction of the cost.

## Key Features
- **AI Writing Tutor**: Real-time evaluation of essays with band score estimations, grammar explanations, and vocabulary enhancements.
- **AI Speaking Trainer**: Interactive speaking prompts with audio analysis covering pronunciation and fluency.
- **Adaptive Reading & Listening**: Complete mock exams with automated tracking and page-by-page references.`;

/* ------------------------------------------------------------------ */
/*  Section icon mapping — maps h2 heading keywords to icons          */
/* ------------------------------------------------------------------ */
const SECTION_ICONS: Record<string, React.ReactNode> = {
  mission: <Target className="size-5" />,
  feature: <Sparkles className="size-5" />,
  team: <Users className="size-5" />,
  about: <Info className="size-5" />,
};

function getSectionIcon(heading: string): React.ReactNode {
  const lower = heading.toLowerCase();
  for (const [keyword, icon] of Object.entries(SECTION_ICONS)) {
    if (lower.includes(keyword)) return icon;
  }
  return <BookOpen className="size-5" />;
}

/* ------------------------------------------------------------------ */
/*  Reading-time helper                                                */
/* ------------------------------------------------------------------ */
function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function AboutPage() {
  const { theme, toggle } = useTheme();
  const [title, setTitle] = useState("About Us");
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPage() {
      try {
        const { data, error } = await (supabase as any)
          .from("site_pages")
          .select("*")
          .eq("slug", "about")
          .maybeSingle();

        if (data && !error) {
          setTitle(data.title);
          setContent(data.content);
        } else {
          const localContent = localStorage.getItem("prepai_page_content_about");
          const localTitle = localStorage.getItem("prepai_page_title_about");
          if (localContent) {
            setContent(localContent);
            setTitle(localTitle || "About Us");
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

  const readingTime = useMemo(() => estimateReadingTime(content), [content]);

  /* ----- headings for mini TOC sidebar ----- */
  const headings = useMemo(() => {
    const matches: string[] = [];
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) matches.push(trimmed.substring(3));
    }
    return matches;
  }, [content]);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col font-sans animate-in fade-in duration-700">
      {/* ───────── Header ───────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-lg font-bold tracking-tight transition-colors group-hover:text-accent">
              Pass<span className="text-accent">Asistant</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/" className="gap-1.5">
                <ArrowLeft className="size-3.5" /> Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ───────── Hero section ───────── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -bottom-32 right-0 w-[28rem] h-[28rem] rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-32 rounded-full bg-accent/[0.07] blur-2xl rotate-12" />
        </div>

        <div className="max-w-5xl mx-auto px-6 pt-10 pb-12 md:pt-14 md:pb-16">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Link to="/" className="hover:text-accent transition-colors">
              Home
            </Link>
            <ChevronRight className="size-3.5 opacity-50" />
            <span className="text-foreground font-medium">About</span>
          </nav>

          {/* Title area */}
          <div className="flex items-start gap-5">
            <div className="hidden md:flex shrink-0 mt-1 items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 text-accent">
              <Info className="size-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-foreground via-foreground to-accent bg-clip-text text-transparent leading-[1.15] mb-3">
                {title}
              </h1>

              {/* Meta pills */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1">
                  <Clock className="size-3.5 text-accent" />
                  {readingTime} min read
                </span>
                <span className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1">
                  <BookOpen className="size-3.5 text-accent" />
                  {headings.length} sections
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Main content ───────── */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16 lg:flex lg:gap-12">
          {/* Sidebar TOC — large screens */}
          {!loading && headings.length > 0 && (
            <aside className="hidden lg:block w-48 shrink-0">
              <div className="sticky top-24">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  On this page
                </p>
                <ul className="space-y-2 border-l border-border pl-4">
                  {headings.map((h, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground hover:text-accent transition-colors leading-snug"
                    >
                      <span className="text-accent/60 font-mono text-xs mr-1.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          {/* Article body */}
          <article className="flex-1 min-w-0 max-w-3xl">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-muted-foreground">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-accent/20 blur-xl animate-pulse" />
                  <Loader2 className="size-10 animate-spin text-accent relative" />
                </div>
                <p className="mt-6 text-sm font-medium">Loading content…</p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SimpleMarkdown content={content} />
              </div>
            )}
          </article>
        </div>
      </main>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-border mt-auto bg-surface/40">
        <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Left side — branding */}
            <div>
              <Link
                to="/"
                className="text-lg font-bold tracking-tight inline-flex items-center gap-1.5"
              >
                Pass<span className="text-accent">Asistant</span>
              </Link>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs leading-relaxed">
                AI-powered English exam preparation — IELTS, TOEFL & TOEIC.
              </p>
            </div>

            {/* Right side — links */}
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-accent transition-colors">
                Privacy
              </Link>
              <span className="text-border">·</span>
              <Link to="/terms" className="hover:text-accent transition-colors">
                Terms
              </Link>
              <span className="text-border">·</span>
              <Link to="/contact" className="hover:text-accent transition-colors">
                Contact
              </Link>
              <span className="text-border">·</span>
              <Link to="/portfolio" className="hover:text-accent transition-colors">
                Creator
              </Link>
            </nav>
          </div>

          <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} PassAsistant. All rights reserved.</span>
            <span className="flex items-center gap-1.5">
              Built with <Sparkles className="size-3 text-accent" /> AI
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ================================================================== */
/*  SimpleMarkdown — renders CMS markdown with premium styling        */
/* ================================================================== */
let sectionCounter = 0;

function SimpleMarkdown({ content }: { content: string }) {
  if (!content) return null;
  sectionCounter = 0;
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-6">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        /* ── H1 ── */
        if (trimmed.startsWith("# ")) {
          return (
            <h1
              key={idx}
              className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-tight leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent pb-4 mb-2 border-b border-border"
            >
              {parseInline(trimmed.substring(2))}
            </h1>
          );
        }

        /* ── H2 ── */
        if (trimmed.startsWith("## ")) {
          sectionCounter++;
          const headingText = trimmed.substring(3);
          const icon = getSectionIcon(headingText);
          return (
            <div key={idx} className="mt-12 mb-5 flex items-center gap-3 group">
              {/* Accent bar + icon */}
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-8 rounded-full bg-accent" />
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                  {icon}
                </span>
              </div>
              <div>
                <span className="block text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent mb-0.5">
                  Section {String(sectionCounter).padStart(2, "0")}
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
                  {parseInline(headingText)}
                </h2>
              </div>
            </div>
          );
        }

        /* ── H3 ── */
        if (trimmed.startsWith("### ")) {
          return (
            <h3
              key={idx}
              className="text-xl font-semibold text-foreground mt-8 mb-3 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-accent/60 shrink-0" />
              {parseInline(trimmed.substring(4))}
            </h3>
          );
        }

        /* ── Lists ── */
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split(/\n[-*]\s+/);
          return (
            <ul key={idx} className="my-5 space-y-3">
              {items.map((item, itemIdx) => {
                let cleanItem = item;
                if (itemIdx === 0) {
                  cleanItem = item.replace(/^[-*]\s+/, "");
                }
                return (
                  <li
                    key={itemIdx}
                    className="flex items-start gap-3 text-foreground/85 text-base leading-relaxed group/li"
                  >
                    <span className="mt-[0.55rem] shrink-0 w-2 h-2 rounded-full bg-accent/70 group-hover/li:bg-accent transition-colors ring-4 ring-accent/10" />
                    <span className="flex-1">{parseInline(cleanItem)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        /* ── Paragraphs ── */
        const lines = trimmed.split("\n");
        return (
          <p
            key={idx}
            className="text-foreground/80 text-base sm:text-[1.05rem] leading-[1.85] max-w-prose my-4"
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

/* ================================================================== */
/*  parseInline — bold, links                                          */
/* ================================================================== */
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
              className="text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent transition-colors"
            >
              {label}
            </a>
          );
        } else {
          return (
            <Link
              key={index}
              to={url as any}
              className="text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent transition-colors"
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
