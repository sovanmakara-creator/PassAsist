import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import {
  Moon,
  Sun,
  ArrowLeft,
  Loader2,
  Scale,
  ChevronRight,
  Clock,
  FileText,
  AlertTriangle,
  BookOpen,
  Shield,
  Mail,
} from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — PassAssist" },
      {
        name: "description",
        content:
          "Terms of Service and usage conditions for the PassAssist English exam preparation website.",
      },
    ],
  }),
  component: TermsPage,
});

const DEFAULT_CONTENT = `# Terms of Service

Last updated: ${new Date().toLocaleDateString()}

Please read these Terms of Service ("Terms") carefully before using PassAssist.

## 1. Agreement to Terms
By accessing or using PassAssist, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the service.

## 2. Learning Material & AI Feedback
PassAssist provides AI-generated feedback for English proficiency exams (IELTS, TOEFL, TOEIC). This feedback is for educational purposes and is not an official score. We do not guarantee score improvements.

## 3. Limitation of Liability
In no event shall PassAssist be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the service.`;

const KEY_POINTS = [
  {
    icon: Shield,
    title: "Your Agreement",
    description: "By using PassAssist, you agree to be bound by these terms and conditions.",
  },
  {
    icon: BookOpen,
    title: "Educational Purpose",
    description: "AI feedback is for learning only — not an official exam score or guarantee.",
  },
  {
    icon: AlertTriangle,
    title: "Liability Limits",
    description: "We are not liable for indirect or consequential damages from service use.",
  },
];

export function TermsPage() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const [title, setTitle] = useState("Terms of Service");
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function loadPage() {
      try {
        const { data, error } = await (supabase as any)
          .from("site_pages")
          .select("*")
          .eq("slug", "terms")
          .maybeSingle();

        if (data && !error) {
          setTitle(data.title);
          setContent(data.content);
        } else {
          const localContent = localStorage.getItem("prepai_page_content_terms");
          const localTitle = localStorage.getItem("prepai_page_title_terms");
          if (localContent) {
            setContent(localContent);
            setTitle(localTitle || "Terms of Service");
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

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col font-sans">
      {/* ─── Header ─── */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <span className="text-lg font-bold tracking-tight transition-colors">
              Pass<span className="text-accent">Assist</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to={user ? "/dashboard" : "/"}>
                <ArrowLeft className="size-4 mr-1.5" />
                {user ? "Dashboard" : "Home"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main
        className="flex-1 transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
        }}
      >
        {/* ─── Hero Section ─── */}
        <section className="relative overflow-hidden border-b border-border">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-accent/10 dark:from-accent/10 dark:via-background dark:to-accent/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

          <div className="relative max-w-5xl mx-auto px-6 pt-10 pb-14">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
              <Link to={user ? "/dashboard" : "/"} className="hover:text-foreground transition-colors">
                {user ? "Dashboard" : "Home"}
              </Link>
              <ChevronRight className="size-3.5 text-muted-foreground/50" />
              <span className="text-foreground font-medium">Terms of Service</span>
            </nav>

            <div className="flex items-start gap-6">
              {/* Icon */}
              <div className="hidden sm:flex shrink-0 size-16 rounded-2xl bg-accent/10 border border-accent/20 items-center justify-center">
                <Scale className="size-8 text-accent" />
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-accent bg-clip-text text-transparent pb-1">
                  Terms of Service
                </h1>
                <p className="mt-3 text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed">
                  Please read these terms carefully before using PassAssist. They govern your use of our
                  platform and services.
                </p>

                {/* Date badges */}
                <div className="flex flex-wrap items-center gap-3 mt-5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    <Clock className="size-3" />
                    Last updated: {currentDate}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-surface text-muted-foreground border border-border">
                    <FileText className="size-3" />
                    Effective immediately
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Key Points Summary ─── */}
        <section className="max-w-5xl mx-auto px-6 -mt-px">
          <div className="mt-10 mb-8">
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-surface/50">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="size-4 text-accent" />
                  Quick Summary — Key Points
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                {KEY_POINTS.map((point) => (
                  <div
                    key={point.title}
                    className="px-6 py-5 group hover:bg-accent/5 transition-colors"
                  >
                    <div className="size-9 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/15 transition-colors">
                      <point.icon className="size-4.5 text-accent" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{point.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Terms Content ─── */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-muted-foreground">
              <div className="size-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
                <Loader2 className="size-7 animate-spin text-accent" />
              </div>
              <p className="text-sm font-medium">Loading Terms of Service...</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Fetching the latest version</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-6 sm:px-10 md:px-14 py-10 md:py-14">
                <SimpleMarkdown content={content} />
              </div>
            </div>
          )}

          {/* ─── CTA Card ─── */}
          <div className="mt-10 rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 p-8 sm:p-10 text-center">
            <div className="size-12 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-4">
              <Mail className="size-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Have questions about our terms?
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
              Our team is here to help clarify any part of these Terms of Service. Don't hesitate to
              reach out.
            </p>
            <Button asChild size="lg" className="bg-accent text-white hover:bg-accent/90 shadow-md">
              <Link to="/contact">
                <Mail className="size-4 mr-2" />
                Contact Us
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border mt-auto bg-surface/30">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm">
              <Link
                to="/privacy"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/about"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Contact
              </Link>
              <Link
                to="/portfolio"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Creator
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} PassAssist. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Simple Markdown Renderer ─── */

function SimpleMarkdown({ content }: { content: string }) {
  if (!content) return null;
  const normalizedContent = content
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\s+(#{1,3}\s)/g, '\n\n$1')
    .replace(/\s+(-\s(?:\*\*.*?\*\*|[A-Z]))/g, '\n$1');
  const blocks = normalizedContent.split(/\n\n+/);
  let sectionNumber = 0;

  return (
    <div className="space-y-6 max-w-none">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        /* ── H1 ── */
        if (trimmed.startsWith("# ")) {
          return (
            <h1
              key={idx}
              className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent pb-4 mb-2 border-b border-border"
            >
              {parseInline(trimmed.substring(2))}
            </h1>
          );
        }

        /* ── H2 ── */
        if (trimmed.startsWith("## ")) {
          sectionNumber++;
          const heading = trimmed.substring(3);
          // Strip leading number like "1. " if present to avoid double-numbering
          const cleanHeading = heading.replace(/^\d+\.\s*/, "");
          return (
            <div
              key={idx}
              className="mt-10 mb-4 flex items-start gap-4 border-l-4 border-accent pl-5 py-1"
            >
              <span className="shrink-0 flex items-center justify-center size-8 rounded-lg bg-accent/10 text-accent font-bold text-sm mt-0.5">
                {sectionNumber}
              </span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                {parseInline(cleanHeading)}
              </h2>
            </div>
          );
        }

        /* ── H3 ── */
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={idx} className="text-lg font-semibold text-foreground mt-6 mb-3 pl-1">
              {parseInline(trimmed.substring(4))}
            </h3>
          );
        }

        /* ── Unordered List ── */
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split(/\n[-*]\s+/);
          return (
            <ul key={idx} className="list-none pl-2 space-y-3 my-4">
              {items.map((item, itemIdx) => {
                let cleanItem = item;
                if (itemIdx === 0) {
                  cleanItem = item.replace(/^[-*]\s+/, "");
                }
                return (
                  <li
                    key={itemIdx}
                    className="flex items-start gap-3 text-foreground/80 text-base leading-relaxed"
                  >
                    <span className="shrink-0 mt-2 size-1.5 rounded-full bg-accent" />
                    <span>{parseInline(cleanItem)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        /* ── Paragraph ── */
        const lines = trimmed.split("\n");
        return (
          <p key={idx} className="text-foreground/80 text-base leading-[1.8] my-4 max-w-[72ch]">
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
              className="text-accent hover:underline underline-offset-2 transition-colors"
            >
              {label}
            </a>
          );
        } else {
          return (
            <Link
              key={index}
              to={url as any}
              className="text-accent hover:underline underline-offset-2 transition-colors"
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
