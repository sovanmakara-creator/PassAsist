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
  ChevronRight,
  Clock,
  BookOpen,
  GraduationCap,
  Code2,
  Sparkles,
  Mail,
  Github,
  Linkedin,
  ExternalLink,
  Facebook,
  Instagram,
  Send,
  Phone,
  Laptop,
  CheckCircle,
  Award,
  Trophy,
  Activity,
  Flame,
  Cpu,
  Globe,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Creator Portfolio — PassAssist" },
      {
        name: "description",
        content:
          "Meet the creator and lead developer of PassAssist English exam preparation platform. Background, skills, and vision.",
      },
    ],
  }),
  component: PortfolioPage,
});

const DEFAULT_CONTENT = `# Creator Portfolio

Welcome! My name is Sovanmakara (Janric), a 20-year-old software engineering student from Siem Reap, Cambodia.

## Profile
- **Name**: Sovanmakara Pov (Janric)
- **Role**: Software Engineering Student & Developer
- **Avatar**: https://github.com/sovanmakara-creator.png
- **Socials**: [Facebook: Sovanmkara POV](https://facebook.com) | [Instagram: @janric_sp](https://instagram.com/janric_sp) | [Telegram](https://t.me/+855887821790) | [WhatsApp](https://wa.me/855887821790)

## Background
I am a former Grade A student (99.503 score) from Somdach Ouv High School (Class of 2023-2024), where I was the top student in class. My ambition is to help the Technology industry grow in Cambodia as a dedicated software engineer. I have a strong interest in Software Development and have been taking web development courses since high school.

## Education & Languages
- **High School**: Somdach Ouv High School, Siem Reap (Grade A, 99.503)
- **Languages**: 
  - English: Upper-Intermediate (ACE, 2024)
  - Thai: Pre-intermediate (Rajabat Buriram University, 2025)
  - Khmer: Native

## Skills & Technologies
- **Programming Languages**: C#, C++, JavaScript, PHP (Basic)
- **Web Technologies**: HTML, CSS, Bootstrap, jQuery
- **Tools**: GitHub, VS Code, AWS Basics
- **Design Tools**: Adobe Photoshop, Adobe Illustrator, Canva
- **Soft Skills**: Teamwork, Communication, Leadership, Presentation

## Certifications & Achievements
- **AWS Certified Cloud Practitioner**
- **Cloud4Cambodia Battambang Program** (AWS Cloud Bootcamp)
- **TOEFL ITP**: Score 507
- **English Public Speaking Training Course**
- **PSU Futsal International Open 2025**

## Personal Interests
Beyond coding, I enjoy music & art, creating vlogs, adopting new technologies, gaming, designing, going to the gym, and reading.`;

/* ------------------------------------------------------------------ */
/*  Reading-time helper                                                */
/* ------------------------------------------------------------------ */
function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

/* ================================================================== */
/*  Individual detail section card                                     */
/* ================================================================== */
function DetailSectionCard({ section, index }: { section: any; index: number }) {
  // Section icon config
  let Icon = BookOpen;
  let iconBg = "bg-accent/10 border-accent/20 text-accent";
  let cardBg = "bg-card/45 hover:bg-card/75 border-border/80 hover:border-border";

  const titleLower = section.title?.toLowerCase() || "";

  if (section.type === "background") {
    Icon = GraduationCap;
    iconBg = "bg-blue-500/10 border-blue-500/20 text-blue-500";
  } else if (section.type === "technologies") {
    Icon = Code2;
    iconBg = "bg-purple-500/10 border-purple-500/20 text-purple-500";
  } else if (section.type === "project") {
    Icon = Sparkles;
    iconBg = "bg-amber-500/10 border-amber-500/20 text-amber-500";
    cardBg =
      "bg-accent/[0.02] border-accent/15 hover:bg-accent/[0.04] hover:border-accent/35 shadow-accent/[0.01]";
  } else if (titleLower.includes("education")) {
    Icon = GraduationCap;
    iconBg = "bg-blue-500/10 border-blue-500/20 text-blue-500";
  } else if (titleLower.includes("certification") || titleLower.includes("achievement")) {
    Icon = Award;
    iconBg = "bg-amber-500/10 border-amber-500/20 text-amber-500";
  } else if (titleLower.includes("interest")) {
    Icon = Trophy;
    iconBg = "bg-rose-500/10 border-rose-500/20 text-rose-500";
  }

  return (
    <ScrollReveal delay={100 + index * 50} direction="up">
      <GlowCard
        className={`rounded-3xl border p-6 md:p-8 transition-all duration-300 shadow-sm ${cardBg}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div
            className={`flex items-center justify-center size-11 rounded-xl border ${iconBg}`}
          >
            <Icon className="size-5.5" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            {section.title}
          </h3>
        </div>

        {/* Custom renders per section category */}
        {section.type === "technologies" ? (
          <RenderSkills blocks={section.rawBlocks} />
        ) : (
          <div className="space-y-4">
            {section.rawBlocks.map((block: string, bi: number) => {
              if (block.startsWith("- ") || block.startsWith("* ")) {
                const items = block.split(/\n[-*]\s+/);
                return (
                  <ul key={bi} className="space-y-4 my-4 pl-1">
                    {items.map((item, itemIdx) => {
                      let clean = item;
                      if (itemIdx === 0) clean = item.replace(/^[-*]\s+/, "");
                      return (
                        <li
                          key={itemIdx}
                          className="flex items-start gap-3.5 text-foreground/85 leading-relaxed text-[1.05rem] group/li"
                        >
                          <span className="mt-[0.6rem] shrink-0 size-2 rounded-full bg-accent/60 group-hover/li:bg-accent group-hover/li:scale-110 transition-all border border-background ring-4 ring-accent/10" />
                          <span>{parseInline(clean)}</span>
                        </li>
                      );
                    })}
                  </ul>
                );
              }
              return (
                <p
                  key={bi}
                  className="text-foreground/80 text-[1.05rem] leading-[1.8] font-normal"
                >
                  {parseInline(block)}
                </p>
              );
            })}
          </div>
        )}
      </GlowCard>
    </ScrollReveal>
  );
}

/* ================================================================== */
/*  Main detailed items list column                                    */
/* ================================================================== */
function MainDetailsColumn({
  introSection,
  rightSections,
}: {
  introSection: any;
  rightSections: any[];
}) {
  return (
    <div className="space-y-8">
      {/* Intro block - full width */}
      {introSection && (
        <ScrollReveal delay={50} direction="up">
          <div className="space-y-5 bg-card/25 border border-border/60 rounded-3xl p-6 md:p-8">
            {introSection.rawBlocks.map((b: string, bi: number) => {
              const hasMarkdown = b.includes("**") || b.includes("[");
              return (
                <p key={bi} className="text-foreground/80 text-lg leading-[1.8] font-normal max-w-prose">
                  {hasMarkdown ? parseInline(b) : <TypewriterText text={b} delay={650} />}
                </p>
              );
            })}
          </div>
        </ScrollReveal>
      )}

      {/* Right Column Sections */}
      {rightSections.map((section, index) => (
        <DetailSectionCard key={index} section={section} index={index} />
      ))}

      {/* CTA Box - full width */}
      <ScrollReveal delay={150} direction="up">
        <GlowCard className="rounded-3xl bg-gradient-to-br from-accent/8 via-background to-accent/4 border border-accent/15 p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div>
            <h4 className="text-xl font-bold text-foreground mb-1.5">
              Want to build something similar?
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Let's discuss educational technology, AI integrations, or custom development.
            </p>
          </div>
          <Button
            size="default"
            asChild
            className="rounded-xl shadow-md shrink-0 font-semibold cursor-pointer"
          >
            <Link to="/contact">Get In Touch</Link>
          </Button>
        </GlowCard>
      </ScrollReveal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function PortfolioPage() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const [title, setTitle] = useState("Creator Portfolio");
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
      setScrollOffset(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function loadPage() {
      try {
        const { data, error } = await (supabase as any)
          .from("site_pages")
          .select("*")
          .eq("slug", "portfolio")
          .maybeSingle();

        if (data && !error) {
          setTitle(data.title);
          setContent(data.content);
        } else {
          const localContent = localStorage.getItem("prepai_page_content_portfolio");
          const localTitle = localStorage.getItem("prepai_page_title_portfolio");
          if (localContent && localContent.includes("Avatar")) {
            setContent(localContent);
            setTitle(localTitle || "Creator Portfolio");
          } else {
            // Force reload with the new default content that includes the avatar
            setContent(DEFAULT_CONTENT);
            setTitle("Creator Portfolio");
            localStorage.setItem("prepai_page_content_portfolio", DEFAULT_CONTENT);
            localStorage.setItem("prepai_page_title_portfolio", "Creator Portfolio");
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

  // Fade-in after load
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const readingTime = useMemo(() => estimateReadingTime(content), [content]);

  // Structured layout parsing
  const parsedSections = useMemo(() => {
    if (!content) return [];
    const lines = content.split("\n");
    const sections: {
      type: "intro" | "profile" | "background" | "technologies" | "project" | "generic";
      title?: string;
      lines: string[];
    }[] = [];

    let currentSection: (typeof sections)[number] = { type: "intro", lines: [] };

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("## ")) {
        if (currentSection.lines.length > 0 || currentSection.title) {
          sections.push(currentSection);
        }

        const headingText = trimmed.substring(3).trim();
        const lowerText = headingText.toLowerCase();

        let type: typeof currentSection.type = "generic";
        if (lowerText.includes("profile")) type = "profile";
        else if (lowerText.includes("background")) type = "background";
        else if (lowerText.includes("technologies") || lowerText.includes("skills"))
          type = "technologies";
        else if (lowerText.includes("prepai") || lowerText.includes("project")) type = "project";

        currentSection = { type, title: headingText, lines: [] };
      } else if (trimmed.startsWith("# ")) {
        if (currentSection.lines.length > 0 || currentSection.title) {
          sections.push(currentSection);
        }
        currentSection = { type: "intro", title: trimmed.substring(2).trim(), lines: [] };
      } else {
        currentSection.lines.push(line);
      }
    }

    if (currentSection.lines.length > 0 || currentSection.title) {
      sections.push(currentSection);
    }

    // Map section lines to blocks divided by empty lines
    return sections.map((s) => {
      const blocks: string[] = [];
      let currentBlock: string[] = [];

      for (const line of s.lines) {
        if (line.trim() === "") {
          if (currentBlock.length > 0) {
            blocks.push(currentBlock.join("\n"));
            currentBlock = [];
          }
        } else {
          currentBlock.push(line);
        }
      }
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
      }

      return {
        type: s.type,
        title: s.title,
        rawBlocks: blocks,
      };
    });
  }, [content]);

  const leftSections = useMemo(() => {
    return parsedSections.filter((section) => {
      if (!section.title) return false;
      const titleLower = section.title.toLowerCase();
      return (
        titleLower.includes("education") ||
        titleLower.includes("language") ||
        titleLower.includes("interest")
      );
    });
  }, [parsedSections]);

  const rightSections = useMemo(() => {
    return parsedSections.filter((section) => {
      if (section.type === "profile" || section.type === "intro") return false;
      const titleLower = section.title?.toLowerCase() || "";
      const isLeft =
        titleLower.includes("education") ||
        titleLower.includes("language") ||
        titleLower.includes("interest");
      return !isLeft;
    });
  }, [parsedSections]);

  return (
    <div className="min-h-dvh text-foreground flex flex-col font-sans animate-in fade-in duration-700">
      {/* Background color layer */}
      <div className="fixed inset-0 bg-background -z-30 pointer-events-none" />

      {/* Scroll Progress Indicator */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent via-purple-500 to-accent z-[100] origin-left transition-transform duration-75"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />

      {/* Floating Icons Background */}
      <FloatingIconsBackground />

      {/* ───────── Header ───────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <span className="text-lg font-bold tracking-tight transition-colors group-hover:text-accent">
              Pass<span className="text-accent">Assist</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to={user ? "/dashboard" : "/"} className="gap-1.5">
                <ArrowLeft className="size-3.5" /> {user ? "Dashboard" : "Home"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ───────── Hero Section ───────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-accent/[0.03] to-transparent">
        {/* Parallax Background Blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent/15 blur-3xl transition-transform duration-100 ease-out"
            style={{ transform: `translate3d(0, ${scrollOffset * 0.15}px, 0)` }}
          />
          <div
            className="absolute -bottom-32 right-0 w-[28rem] h-[28rem] rounded-full bg-accent/10 blur-3xl transition-transform duration-100 ease-out animate-float"
            style={{ transform: `translate3d(0, ${-scrollOffset * 0.08}px, 0)` }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-6 pt-12 pb-14 md:pt-16 md:pb-20">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Link to={user ? "/dashboard" : "/"} className="hover:text-accent transition-colors">
              {user ? "Dashboard" : "Home"}
            </Link>
            <ChevronRight className="size-3.5 opacity-55" />
            <span className="text-foreground font-semibold">Creator</span>
          </nav>

          <div className="flex items-start gap-6">
            <div
              className={`hidden md:flex shrink-0 mt-1 items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 text-accent shadow-inner transition-all duration-700 ease-out ${
                visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-90"
              }`}
              style={{
                transitionDelay: "100ms",
              }}
            >
              <Laptop className="size-8 animate-float" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-4 drop-shadow-sm flex flex-wrap gap-x-[0.25em]">
                {title.split(" ").map((word, i) => (
                  <span
                    key={i}
                    className={`inline-block bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent animate-text-gradient transition-all duration-700 ease-out ${
                      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{
                      transitionDelay: `${i * 120 + 200}ms`,
                    }}
                  >
                    {word}
                  </span>
                ))}
              </h1>

              {/* Meta pills with staggered reveal */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span
                  className={`inline-flex items-center gap-1.5 bg-surface border border-border/80 rounded-full px-3 py-1 font-medium shadow-sm transition-all duration-700 ease-out ${
                    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{
                    transitionDelay: "500ms",
                  }}
                >
                  <Clock className="size-3.5 text-accent" />
                  {readingTime} min read
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 bg-surface border border-border/80 rounded-full px-3 py-1 font-medium shadow-sm transition-all duration-700 ease-out ${
                    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{
                    transitionDelay: "600ms",
                  }}
                >
                  <Sparkles className="size-3.5 text-accent animate-pulse" />
                  Lead Developer & Founder
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Main Content ───────── */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-muted-foreground animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent/20 blur-xl animate-pulse" />
                <Loader2 className="size-10 animate-spin text-accent relative" />
              </div>
              <div className="mt-6 flex items-center space-x-2">
                <span className="text-sm font-semibold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-muted-foreground to-foreground animate-pulse">
                  Loading Portfolio
                </span>
                <span className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 lg:grid-cols-12 gap-8 transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              {/* Left Column - Profile Card and Supporting Sections */}
              <div className="lg:col-span-5 space-y-6">
                <ProfileColumn sections={parsedSections} />
                {leftSections.map((section, index) => (
                  <DetailSectionCard key={index} section={section} index={index + 5} />
                ))}
              </div>

              {/* Right Column - Main Details */}
              <div className="lg:col-span-7 space-y-8">
                <MainDetailsColumn
                  introSection={parsedSections.find((s) => s.type === "intro")}
                  rightSections={rightSections}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-border mt-auto bg-surface/40">
        <div className="max-w-5xl mx-auto px-6 py-8 md:py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <Link
                to={user ? "/dashboard" : "/"}
                className="text-lg font-bold tracking-tight inline-flex items-center gap-1.5"
              >
                Pass<span className="text-accent">Assist</span>
              </Link>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs leading-relaxed">
                AI-powered English exam preparation — IELTS, TOEFL & TOEIC.
              </p>
            </div>

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
              <span className="text-foreground font-semibold">Creator</span>
            </nav>
          </div>

          <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} PassAssist. All rights reserved.</span>
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
/*  Helper Profile Extraction Card                                     */
/* ================================================================== */
function ProfileColumn({ sections }: { sections: any[] }) {
  const profileSection = sections.find((s) => s.type === "profile");

  const parsedData = useMemo(() => {
    const info: Record<string, string> = {};
    const links: {
      label: string;
      url: string;
      type: "github" | "linkedin" | "email" | "facebook" | "instagram" | "telegram" | "whatsapp" | "generic";
    }[] = [];

    if (!profileSection) return { info, links };

    const itemsText: string[] = [];
    for (const block of profileSection.rawBlocks) {
      if (block.startsWith("- ") || block.startsWith("* ")) {
        itemsText.push(...block.split(/\n[-*]\s+/));
      }
    }

    for (let item of itemsText) {
      item = item.replace(/^[-*]\s+/, "").trim();
      const match = item.match(/\*\*(.*?)\*\*:\s*(.*)/);
      if (match) {
        const key = match[1].toLowerCase().trim();
        const val = match[2].trim();

        if (key.includes("email")) {
          info.email = val;
        } else if (key.includes("name")) {
          info.name = val;
        } else if (key.includes("role") || key.includes("title")) {
          info.role = val;
        } else if (key.includes("quote")) {
          info.quote = val;
        } else if (key.includes("avatar")) {
          info.avatar = val;
        } else if (
          key.includes("social") ||
          key.includes("link") ||
          key.includes("github") ||
          key.includes("linkedin")
        ) {
          // Parse links like [GitHub](url)
          const linkMatches = val.matchAll(/\[(.*?)\]\((.*?)\)/g);
          for (const lm of linkMatches) {
            const label = lm[1];
            const url = lm[2];
            const lowerLabel = label.toLowerCase();
            let linkType: string = "generic";
            if (lowerLabel.includes("github")) linkType = "github";
            else if (lowerLabel.includes("linkedin")) linkType = "linkedin";
            else if (lowerLabel.includes("facebook")) linkType = "facebook";
            else if (lowerLabel.includes("instagram")) linkType = "instagram";
            else if (lowerLabel.includes("telegram")) linkType = "telegram";
            else if (lowerLabel.includes("whatsapp")) linkType = "whatsapp";

            links.push({ label, url, type: linkType as any });
          }
        } else {
          info[match[1]] = val;
        }
      }
    }

    return { info, links };
  }, [profileSection]);

  const name = parsedData.info.name || "Founder & Creator";
  const role = parsedData.info.role || "Lead Developer";
  const email = parsedData.info.email || "support@prepai.com";
  const avatarUrl = parsedData.info.avatar || "";

  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState("");

  useEffect(() => {
    async function resolveAvatar() {
      if (!avatarUrl) {
        setResolvedAvatarUrl("");
        return;
      }

      if (
        avatarUrl.startsWith("http://") ||
        avatarUrl.startsWith("https://") ||
        avatarUrl.startsWith("/")
      ) {
        const storagePrefix = "/public/pdfs/";
        const idx = avatarUrl.indexOf(storagePrefix);
        if (idx !== -1) {
          const path = avatarUrl.substring(idx + storagePrefix.length);
          const { data, error } = await supabase.storage
            .from("pdfs")
            .createSignedUrl(path, 31536000);
          if (!error && data?.signedUrl) {
            setResolvedAvatarUrl(data.signedUrl);
            return;
          }
        }
        setResolvedAvatarUrl(avatarUrl);
      } else {
        const { data, error } = await supabase.storage
          .from("pdfs")
          .createSignedUrl(avatarUrl, 31536000);
        if (!error && data?.signedUrl) {
          setResolvedAvatarUrl(data.signedUrl);
        } else {
          setResolvedAvatarUrl(avatarUrl);
        }
      }
    }
    resolveAvatar();
  }, [avatarUrl]);

  // Create avatar initials
  const initials = useMemo(() => {
    return name
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }, [name]);

  return (
    <GlowCard className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 md:p-8 shadow-xl relative overflow-hidden group hover:border-accent/30 hover:shadow-2xl transition-all duration-300">
      <div className="absolute top-0 inset-x-0 h-[3px] w-full bg-gradient-to-r from-accent via-accent/50 to-transparent" />
      <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-accent/5 blur-2xl group-hover:bg-accent/10 transition-colors" />

      {/* Avatar image / Initial badge */}
      <div className="flex flex-col items-center text-center mt-4">
        {resolvedAvatarUrl ? (
          <div className="relative mb-6 flex items-center justify-center size-56 md:size-64 rounded-full overflow-hidden border-2 border-accent/20 shadow-md bg-muted/10">
            <img
              src={resolvedAvatarUrl}
              alt={name}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className="absolute bottom-3 right-3 size-6 rounded-full bg-success border-[3.5px] border-card animate-pulse"
              title="Available for projects"
            />
          </div>
        ) : (
          <div className="relative mb-6 flex items-center justify-center size-56 md:size-64 rounded-full bg-accent/10 border-2 border-accent/20 text-accent font-bold text-5xl md:text-6xl tracking-wider shadow-inner group-hover:bg-accent/15 transition-colors">
            {initials}
            <div
              className="absolute bottom-3 right-3 size-6 rounded-full bg-success border-[3.5px] border-card"
              title="Available for projects"
            />
          </div>
        )}

        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{name}</h2>
        <p className="text-sm text-accent font-semibold tracking-wide uppercase mt-1.5">{role}</p>
        {parsedData.info.quote && (
          <p className="text-[15px] italic text-muted-foreground font-medium mt-3 px-2 leading-relaxed">
            &quot;{parsedData.info.quote}&quot;
          </p>
        )}
        <div className="h-px w-24 bg-border my-6" />
      </div>

      {/* Details info */}
      <div className="space-y-4">
        {Object.entries(parsedData.info).map(([key, val]) => {
          if (["name", "role", "avatar", "quote"].includes(key)) return null;
          const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
          return (
            <div
              key={key}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-sm py-3 border-b border-border/40 last:border-0 gap-1 sm:gap-4"
            >
              <span className="text-muted-foreground font-medium shrink-0">{displayKey}</span>
              <span className="font-semibold text-foreground text-left sm:text-right break-words w-full sm:max-w-[65%]">
                {val}
              </span>
            </div>
          );
        })}

        {/* Email action */}
        {email && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 rounded-xl mt-6 font-semibold text-sm border-border hover:border-accent/40 hover:text-accent hover:bg-accent/[0.02]"
            asChild
          >
            <a href={`mailto:${email}`}>
              <Mail className="size-4" />
              <span>Email Me</span>
            </a>
          </Button>
        )}
      </div>

      {/* Social Links buttons */}
      {parsedData.links.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border flex justify-center gap-3.5">
          {parsedData.links.map((link, i) => {
            let Icon = ExternalLink;
            if (link.type === "github") Icon = Github;
            else if (link.type === "linkedin") Icon = Linkedin;
            else if (link.type === "facebook") Icon = Facebook;
            else if (link.type === "instagram") Icon = Instagram;
            else if (link.type === "telegram") Icon = Send;
            else if (link.type === "whatsapp") Icon = Phone;
            
            return (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="size-11 rounded-xl border border-border bg-background hover:bg-accent/10 hover:border-accent hover:text-accent transition-all flex items-center justify-center text-muted-foreground shadow-sm hover:-translate-y-0.5"
                title={link.label}
              >
                <Icon className="size-5" />
              </a>
            );
          })}
        </div>
      )}
    </GlowCard>
  );
}



/* ================================================================== */
/*  Custom parser to render tech items as tag badges                  */
/* ================================================================== */
function RenderSkills({ blocks }: { blocks: string[] }) {
  const categories = useMemo(() => {
    const list: { name: string; tags: string[] }[] = [];
    const itemsText: string[] = [];

    for (const block of blocks) {
      if (block.startsWith("- ") || block.startsWith("* ")) {
        itemsText.push(...block.split(/\n[-*]\s+/));
      }
    }

    for (let item of itemsText) {
      item = item.replace(/^[-*]\s+/, "").trim();
      const match = item.match(/\*\*(.*?)\*\*:\s*(.*)/);
      if (match) {
        const catName = match[1];
        const tags = match[2]
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        list.push({ name: catName, tags });
      }
    }

    return list;
  }, [blocks]);

  if (categories.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No technologies listed. Open admin panel to fill in.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((cat, i) => (
        <div key={i} className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-accent/90">
            {cat.name}
          </span>
          <div className="flex flex-wrap gap-2">
            {cat.tags.map((tag, ti) => (
              <span
                key={ti}
                className="px-3.5 py-1.5 rounded-xl bg-surface border border-border/80 text-sm font-semibold text-foreground/90 hover:border-accent/40 hover:bg-accent/[0.03] hover:text-accent transition-all cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Inline Link/Bold Parser (shared matching logic)                    */
/* ================================================================== */
function parseInline(text: string) {
  const inlineRegex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
  const tokens = text.split(inlineRegex);

  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-foreground">
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
              className="text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent transition-colors font-semibold"
            >
              {label}
            </a>
          );
        } else {
          return (
            <Link
              key={index}
              to={url as any}
              className="text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent transition-colors font-semibold"
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

/* ================================================================== */
/*  ScrollReveal Component (using IntersectionObserver)               */
/* ================================================================== */
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(ref);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -50px 0px" },
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  let dirClass = "";
  if (direction === "up") dirClass = "translate-y-8";
  else if (direction === "down") dirClass = "-translate-y-8";
  else if (direction === "left") dirClass = "translate-x-8";
  else if (direction === "right") dirClass = "-translate-x-8";
  else if (direction === "none") dirClass = "scale-95";

  return (
    <div
      ref={setRef as any}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        isIntersecting
          ? "opacity-100 translate-y-0 translate-x-0 scale-100"
          : `opacity-0 ${dirClass}`
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ================================================================== */
/*  GlowCard Component (Dynamic Hover Radial Glow & Border tracking)  */
/* ================================================================== */
export function GlowCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden ${className}`}
      style={
        {
          "--mouse-x": `${coords.x}px`,
          "--mouse-y": `${coords.y}px`,
        } as React.CSSProperties
      }
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 -z-0 pointer-events-none transition-opacity duration-500 ease-out"
        style={{
          opacity: isHovered ? 0.12 : 0,
          background: `radial-gradient(350px circle at var(--mouse-x) var(--mouse-y), oklch(0.65 0.2 258 / 25%), transparent 80%)`,
        }}
      />
      {/* Border dynamic neon tracking glow */}
      <div
        className="absolute inset-0 -z-0 pointer-events-none transition-opacity duration-500 ease-out"
        style={{
          opacity: isHovered ? 0.55 : 0,
          background: `radial-gradient(200px circle at var(--mouse-x) var(--mouse-y), oklch(0.65 0.2 258 / 45%), transparent 85%)`,
          WebkitMaskImage: `linear-gradient(white, white) content-box, linear-gradient(white, white)`,
          WebkitMaskComposite: "xor",
          padding: "1.2px",
        }}
      />
      <div className="relative z-10 size-full">{children}</div>
    </div>
  );
}

/* ================================================================== */
/*  Floating Background Icons Particle Component                      */
/* ================================================================== */
interface IconParticle {
  id: number;
  iconName: string;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

const ICON_MAP: Record<string, any> = {
  GraduationCap,
  BookOpen,
  Award,
  FileText,
  Trophy,
  Activity,
  Flame,
  Code2,
  Laptop,
  Cpu,
  Sparkles,
  Globe,
};

export function FloatingIconsBackground() {
  const [particles, setParticles] = useState<IconParticle[]>([]);

  useEffect(() => {
    const iconNames = Object.keys(ICON_MAP);
    // Generate 18 floating particles of diverse dimensions
    const generated: IconParticle[] = Array.from({ length: 18 }).map((_, i) => {
      return {
        id: i,
        iconName: iconNames[Math.floor(Math.random() * iconNames.length)],
        left: Math.random() * 95,
        size: Math.floor(Math.random() * 20) + 16, // 16px to 36px
        duration: Math.floor(Math.random() * 15) + 20, // 20s to 35s speed
        delay: Math.floor(Math.random() * 15), // 0s to 15s delay
        opacity: Math.random() * 0.15 + 0.12, // 0.12 to 0.27 opacity
      };
    });
    setParticles(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-20">
      {particles.map((p) => {
        const IconComponent = ICON_MAP[p.iconName] || BookOpen;
        return (
          <div
            key={p.id}
            className="absolute bottom-0 animate-float-up"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          >
            <IconComponent className="size-full text-accent" style={{ opacity: p.opacity }} />
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/*  TypewriterText Component (Animated Text Typing Effect - Infinite Loop) */
/* ================================================================== */
export function TypewriterText({
  text,
  speed = 85,
  delay = 500,
}: {
  text: string;
  speed?: number;
  delay?: number;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let timer: any;

    if (!isDeleting) {
      if (displayedText.length < text.length) {
        timer = setTimeout(() => {
          setDisplayedText(text.slice(0, displayedText.length + 1));
        }, speed);
      } else {
        // Pause for 3 seconds before deleting
        timer = setTimeout(() => setIsDeleting(true), 3000);
      }
    } else {
      if (displayedText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedText(text.slice(0, displayedText.length - 1));
        }, speed / 2); // delete at double speed
      } else {
        // Pause for 1 second before typing again
        timer = setTimeout(() => setIsDeleting(false), 1000);
      }
    }

    return () => clearTimeout(timer);
  }, [started, displayedText, isDeleting, text, speed]);

  return (
    <span>
      {displayedText}
      <span className="inline-block w-[2.5px] h-[1.1em] bg-accent ml-1 align-middle animate-pulse" />
    </span>
  );
}
