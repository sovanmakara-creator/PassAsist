import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import {
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Lightbulb,
  GraduationCap,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { HELPFUL_SOURCES, type PracticeResource } from "@/services/exam-resources";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/helpful")({
  head: () => ({
    meta: [
      { title: "Helpful Sources — PassAsistant" },
      {
        name: "description",
        content:
          "Curated collection of helpful English learning resources including grammar, vocabulary, conversation, and exam preparation materials.",
      },
    ],
  }),
  component: HelpfulPage,
});

/* ------------------------------------------------------------------ */
/*  Completed-tracking hook (localStorage)                            */
/* ------------------------------------------------------------------ */
function useCompletedResources() {
  const STORAGE_KEY = "prepai_completed_resources";

  const [completed, setCompleted] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
    } catch {
      /* ignore quota errors */
    }
  }, [completed]);

  const toggle = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return { completed, toggle };
}

/* ------------------------------------------------------------------ */
/*  Category definitions                                               */
/* ------------------------------------------------------------------ */
type Category = {
  id: string;
  label: string;
  keywords: string[];
};

const CATEGORIES: Category[] = [
  { id: "all", label: "All", keywords: [] },
  {
    id: "grammar",
    label: "Grammar & Errors",
    keywords: ["grammar", "mistakes", "errors", "sentence completion"],
  },
  {
    id: "vocabulary",
    label: "Vocabulary & Phrases",
    keywords: ["phrasal", "collocations", "synonym", "antonym", "idioms", "phrases", "slang"],
  },
  {
    id: "conversation",
    label: "Conversation & Dialogue",
    keywords: ["conversation", "dialogue", "spoken", "debate"],
  },
  { id: "reading", label: "Reading & Critical Thinking", keywords: ["reading", "critical"] },
];

function categorize(resource: PracticeResource): string[] {
  const text = (resource.title + " " + resource.description).toLowerCase();
  const matched: string[] = [];
  for (const cat of CATEGORIES) {
    if (cat.id === "all") continue;
    if (cat.keywords.some((kw) => text.includes(kw))) {
      matched.push(cat.id);
    }
  }
  return matched.length > 0 ? matched : ["other"];
}

/* ------------------------------------------------------------------ */
/*  Difficulty badge                                                   */
/* ------------------------------------------------------------------ */
function difficultyColor(d?: string): string {
  if (d === "beginner") return "text-emerald-400";
  if (d === "advanced") return "text-amber-400";
  return "text-sky-400";
}

/* ------------------------------------------------------------------ */
/*  Resource card                                                      */
/* ------------------------------------------------------------------ */
function ResourceCard({
  resource,
  isCompleted,
  onToggle,
}: {
  resource: PracticeResource;
  isCompleted: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`group relative rounded-xl border bg-card p-5 transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 ${
        isCompleted ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset bg-violet-500/15 text-violet-400 ring-violet-500/25">
            PDF Resource
          </span>
          {resource.difficulty && (
            <span
              className={`text-[10px] font-medium uppercase tracking-wider ${difficultyColor(resource.difficulty)}`}
            >
              {resource.difficulty}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          }}
          className={`shrink-0 size-7 rounded-md flex items-center justify-center transition-all ${
            isCompleted
              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              : "bg-muted/50 text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted"
          }`}
          title={isCompleted ? "Mark as incomplete" : "Mark as completed"}
        >
          <CheckCircle2 className="size-4" />
        </button>
      </div>

      {/* Title & description */}
      <div className="mb-4">
        <h3 className="font-medium text-sm leading-snug mb-1.5 flex items-center gap-1.5">
          <BookOpen className="size-3.5 text-accent shrink-0" />
          {resource.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{resource.description}</p>
      </div>

      {/* Action */}
      {resource.url.endsWith(".pdf") || resource.url.startsWith("/courses/") ? (
        <Link
          to="/courses/$courseId"
          params={{
            courseId: resource.url.startsWith("/courses/")
              ? resource.url.split("/").pop()!
              : resource.id,
          }}
          search={{ from: "/helpful" }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
        >
          View Document <ExternalLink className="size-3" />
        </Link>
      ) : (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
        >
          Open resource <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
function HelpfulPage() {
  const { completed, toggle } = useCompletedResources();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [resources, setResources] = useState<PracticeResource[]>(HELPFUL_SOURCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadResources() {
      try {
        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .eq("category", "helpful");

        if (data && data.length > 0 && !error) {
          const mapped: PracticeResource[] = data.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            source: "PDF Resource",
            url: item.url,
            type: item.type as any,
            difficulty: item.difficulty as any,
          }));
          setResources(mapped);
        }
      } catch (err) {
        console.warn(
          "Failed to fetch helpful resources from Supabase, using static fallback:",
          err,
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadResources();
  }, []);

  const filteredResources = resources.filter((r) => {
    // Category filter
    if (activeCategory !== "all") {
      const cats = categorize(r);
      if (!cats.includes(activeCategory)) return false;
    }
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const completedCount = resources.filter((r) => completed.has(r.id)).length;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <PageHeader
          eyebrow="Resource Library"
          title="Helpful Sources"
          description="A curated collection of English learning resources covering grammar, vocabulary, conversation practice, and more. All resources are available as downloadable PDFs."
        />

        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
            <BookOpen className="size-4 text-accent" />
            <span className="text-sm font-medium">{resources.length} resources</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <span className="text-sm font-medium">{completedCount} completed</span>
          </div>
          {/* Progress bar */}
          <div className="flex-1 min-w-[120px]">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{
                  width: `${resources.length > 0 ? Math.round((completedCount / resources.length) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "bg-accent/10 text-accent border border-accent/30"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-accent/20"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resource grid */}
        {filteredResources.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Filter className="size-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No resources match your filters</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try a different search term or category
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                isCompleted={completed.has(r.id)}
                onToggle={() => toggle(r.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
