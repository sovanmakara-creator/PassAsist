import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import {
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  ArrowRight,
  Clock,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Trophy,
  Lightbulb,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState, useEffect, useCallback } from "react";
import { ShareButton } from "@/components/share-button";
import {
  EXAM_RESOURCES,
  type PracticeResource,
  type SkillKey,
  type ExamResourceMap,
} from "@/services/exam-resources";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/exams/$code")({
  head: ({ params }) => {
    const ex = EXAM_DATA[params.code as keyof typeof EXAM_DATA];
    return {
      meta: [
        { title: ex ? `${ex.name} prep — PassAssist` : "Exam — PassAssist" },
        { name: "description", content: ex?.desc ?? "Exam prep section." },
      ],
    };
  },
  loader: ({ params }): { code: ExamCode } => {
    if (!(params.code in EXAM_DATA)) throw notFound();
    return { code: params.code as ExamCode };
  },
  component: ExamPage,
  notFoundComponent: () => (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold mb-2">Exam not found</h1>
        <Link to="/exams" className="text-accent">
          Back to exams
        </Link>
      </div>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </AppShell>
  ),
});

type ExamCode = "ielts" | "toefl" | "toeic";

const EXAM_DATA: Record<
  ExamCode,
  {
    name: string;
    scale: string;
    desc: string;
    sections: {
      icon: typeof Headphones;
      name: string;
      time: string;
      q: number;
      skillKey: SkillKey;
    }[];
  }
> = {
  ielts: {
    name: "IELTS",
    scale: "Band 0 – 9",
    desc: "Academic & General Training. Four skills, taken on paper or computer.",
    sections: [
      { icon: Headphones, name: "Listening", time: "30 min", q: 40, skillKey: "listening" },
      { icon: BookOpen, name: "Reading", time: "60 min", q: 40, skillKey: "reading" },
      { icon: PenLine, name: "Writing", time: "60 min", q: 2, skillKey: "writing" },
      { icon: Mic, name: "Speaking", time: "11–14 min", q: 3, skillKey: "speaking" },
    ],
  },
  toefl: {
    name: "TOEFL iBT",
    scale: "0 – 120 pts",
    desc: "Internet-based test. Integrated tasks combine reading, listening and speaking.",
    sections: [
      { icon: BookOpen, name: "Reading", time: "35 min", q: 20, skillKey: "reading" },
      { icon: Headphones, name: "Listening", time: "36 min", q: 28, skillKey: "listening" },
      { icon: Mic, name: "Speaking", time: "16 min", q: 4, skillKey: "speaking" },
      { icon: PenLine, name: "Writing", time: "30 min", q: 2, skillKey: "writing" },
    ],
  },
  toeic: {
    name: "TOEIC",
    scale: "10 – 990 pts",
    desc: "Workplace English assessment used by 14,000+ organizations worldwide.",
    sections: [
      { icon: Headphones, name: "Listening", time: "45 min", q: 100, skillKey: "listening" },
      { icon: BookOpen, name: "Reading", time: "75 min", q: 100, skillKey: "reading" },
    ],
  },
};

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
/*  Source badge colors                                                */
/* ------------------------------------------------------------------ */
function sourceBadgeClass(source: string): string {
  const s = source.toLowerCase();
  if (s.includes("british council")) return "bg-blue-500/15 text-blue-400 ring-blue-500/25";
  if (s.includes("idp")) return "bg-rose-500/15 text-rose-400 ring-rose-500/25";
  if (s.includes("ets")) return "bg-indigo-500/15 text-indigo-400 ring-indigo-500/25";
  if (s.includes("cambridge")) return "bg-purple-500/15 text-purple-400 ring-purple-500/25";
  if (s.includes("magoosh")) return "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25";
  if (s.includes("exam english")) return "bg-amber-500/15 text-amber-400 ring-amber-500/25";
  if (s.includes("prepmyfuture")) return "bg-cyan-500/15 text-cyan-400 ring-cyan-500/25";
  if (s.includes("prepai")) return "bg-accent/15 text-accent ring-accent/25";
  return "bg-muted text-muted-foreground ring-border";
}

function difficultyColor(d?: string): string {
  if (d === "beginner") return "text-emerald-400";
  if (d === "advanced") return "text-amber-400";
  return "text-sky-400";
}

function typeIcon(type: string) {
  if (type === "tips") return <Lightbulb className="size-3.5" />;
  if (type === "mock") return <Trophy className="size-3.5" />;
  return <GraduationCap className="size-3.5" />;
}

/* ------------------------------------------------------------------ */
/*  Resource card                                                     */
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
  const { code } = Route.useParams();
  // Treat as internal route only if it starts with / and is not a static file (e.g., pdf)
  const isInternal = resource.url.startsWith("/") && !resource.url.endsWith(".pdf");

  return (
    <div
      className={`group relative rounded-xl border bg-card p-4 transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 ${
        isCompleted ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${sourceBadgeClass(resource.source)}`}
          >
            {resource.source}
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
          className={`shrink-0 size-6 rounded-md flex items-center justify-center transition-all ${
            isCompleted
              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              : "bg-muted/50 text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted"
          }`}
          title={isCompleted ? "Mark as incomplete" : "Mark as completed"}
        >
          <CheckCircle2 className="size-3.5" />
        </button>
      </div>

      {/* Title & description */}
      <div className="mb-3">
        <h4 className="font-medium text-sm leading-snug mb-1 flex items-center gap-1.5">
          {typeIcon(resource.type)}
          {resource.title}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{resource.description}</p>
      </div>

      {/* Action */}
      {isInternal ? (
        <Link
          to={resource.url.split("?")[0]}
          search={{
            ...Object.fromEntries(new URLSearchParams(resource.url.split("?")[1] ?? "")),
            from: `/exams/${code}`,
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
        >
          <Sparkles className="size-3" /> Open AI Tutor <ArrowRight className="size-3" />
        </Link>
      ) : resource.url.endsWith(".pdf") || resource.url.startsWith("/courses/") ? (
        <Link
          to="/courses/$courseId"
          params={{
            courseId: resource.url.startsWith("/courses/")
              ? resource.url.split("/").pop()!
              : resource.id,
          }}
          search={{ from: `/exams/${code}` }}
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
/*  Main page                                                         */
/* ------------------------------------------------------------------ */
function getResourceSkill(r: { id: string; url: string; type: string }): SkillKey | "mock" {
  if (r.type === "mock" || r.id.includes("-m-") || r.id.endsWith("-m")) {
    return "mock";
  }
  const id = r.id.toLowerCase();
  const url = r.url.toLowerCase();

  if (id.includes("-l-") || id.endsWith("-l") || url.includes("/listening/")) {
    return "listening";
  }
  if (id.includes("-r-") || id.includes("-lr-") || id.endsWith("-r") || url.includes("/reading/")) {
    return "reading";
  }
  if (
    id.includes("-w-") ||
    id.endsWith("-w") ||
    url.includes("/writing/") ||
    url.includes("/writing")
  ) {
    return "writing";
  }
  if (
    id.includes("-s-") ||
    id.endsWith("-s") ||
    url.includes("/speaking/") ||
    url.includes("/speaking") ||
    url.includes("/examiner")
  ) {
    return "speaking";
  }

  return "reading";
}

function ExamPage() {
  const data = Route.useLoaderData() as { code: ExamCode };
  const exam = EXAM_DATA[data.code];

  const [examResources, setExamResources] = useState<ExamResourceMap>(EXAM_RESOURCES[data.code]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadResources() {
      try {
        const { data: dbData, error } = await supabase
          .from("resources")
          .select("*")
          .eq("category", data.code);

        if (dbData && dbData.length > 0 && !error) {
          const grouped: ExamResourceMap = {
            listening: [],
            reading: [],
            writing: [],
            speaking: [],
            mock: [],
          };

          for (const item of dbData) {
            const mapped: PracticeResource = {
              id: item.id,
              title: item.title,
              description: item.description,
              source: "Database Upload",
              url: item.url,
              type: item.type as any,
              difficulty: item.difficulty as any,
            };

            if (item.id.includes("-bc")) mapped.source = "British Council";
            else if (item.id.includes("-idp")) mapped.source = "IDP IELTS";
            else if (item.id.includes("-ets")) mapped.source = "ETS Official";
            else if (item.id.includes("-ee")) mapped.source = "Exam English";
            else if (item.id.includes("-iot")) mapped.source = "IELTS Online Tests";
            else if (item.id.includes("-mag")) mapped.source = "Magoosh";
            else if (item.id.includes("-bmt")) mapped.source = "BestMyTest";
            else if (item.id.includes("-local") || item.id.includes("-internal"))
              mapped.source = "Local Upload";
            else mapped.source = "Online Source";

            const skill = getResourceSkill(item);
            if (!grouped[skill]) {
              grouped[skill] = [];
            }
            grouped[skill]?.push(mapped);
          }

          setExamResources(grouped);
        }
      } catch (err) {
        console.warn("Failed to load resources from Supabase, using static fallback:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadResources();
  }, [data.code]);

  const resources = examResources;
  const { completed, toggle } = useCompletedResources();

  // Available skill tabs for this exam
  const availableSkills = exam.sections.map((s) => s.skillKey);
  const [activeSkill, setActiveSkill] = useState(availableSkills[0]);

  // Count completed per skill
  const completedCount = (skill: SkillKey) => {
    const items = resources?.[skill] ?? [];
    return items.filter((r) => completed.has(r.id)).length;
  };
  const totalCount = (skill: SkillKey) => (resources?.[skill] ?? []).length;
  const mockCompleted = (resources?.mock ?? []).filter((r) => completed.has(r.id)).length;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <PageHeader eyebrow={exam.scale} title={`${exam.name} prep`} description={exam.desc}>
          <ShareButton
            title={`${exam.name} Exam Prep — PassAssist`}
            description={`Prepare for the ${exam.name} exam with targeted practice tests, tips, and direct AI-powered feedback.`}
          />
        </PageHeader>

        {/* Skill overview cards */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {exam.sections.map((s) => {
            const done = completedCount(s.skillKey);
            const total = totalCount(s.skillKey);
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <button
                key={s.name}
                onClick={() => setActiveSkill(s.skillKey)}
                className={`rounded-2xl border p-6 text-left transition-all ${
                  activeSkill === s.skillKey
                    ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
                    : "border-border bg-card hover:border-accent/30"
                }`}
              >
                <div className="size-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-4">
                  <s.icon className="size-4" />
                </div>
                <div className="font-medium mb-1">{s.name}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-3 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {s.time}
                  </span>
                  <span>
                    {s.q} {s.q === 1 ? "task" : "tasks"}
                  </span>
                </div>
                {total > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                      <span>Progress</span>
                      <span>
                        {done}/{total}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </section>

        {/* Practice resources — tabbed by skill */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold tracking-tight mb-5 flex items-center gap-2">
            <GraduationCap className="size-5 text-accent" />
            Practice by Skill
          </h2>

          <Tabs value={activeSkill} onValueChange={(v) => setActiveSkill(v as SkillKey)}>
            <TabsList className="h-auto flex-wrap mb-6">
              {exam.sections.map((s) => (
                <TabsTrigger key={s.skillKey} value={s.skillKey} className="gap-1.5">
                  <s.icon className="size-3.5" />
                  {s.name}
                  {completedCount(s.skillKey) > 0 && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
                      {completedCount(s.skillKey)}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {exam.sections.map((s) => {
              const items = resources?.[s.skillKey] ?? [];
              const practiceItems = items.filter((r) => r.type === "practice");
              const tipItems = items.filter((r) => r.type === "tips");

              return (
                <TabsContent key={s.skillKey} value={s.skillKey}>
                  {items.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card p-8 text-center">
                      <p className="text-muted-foreground">
                        No practice resources available yet for this skill.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Practice tests */}
                      {practiceItems.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                            Practice Tests
                          </h3>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {practiceItems.map((r) => (
                              <ResourceCard
                                key={r.id}
                                resource={r}
                                isCompleted={completed.has(r.id)}
                                onToggle={() => toggle(r.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tips & strategies */}
                      {tipItems.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                            Tips & Strategies
                          </h3>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {tipItems.map((r) => (
                              <ResourceCard
                                key={r.id}
                                resource={r}
                                isCompleted={completed.has(r.id)}
                                onToggle={() => toggle(r.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </section>

        {/* Full Mock Tests */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Trophy className="size-5 text-accent" />
              Full Mock Tests
            </h2>
            {(resources?.mock?.length ?? 0) > 0 && (
              <span className="text-xs text-muted-foreground">
                {mockCompleted}/{resources?.mock?.length ?? 0} completed
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(resources?.mock ?? []).map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                isCompleted={completed.has(r.id)}
                onToggle={() => toggle(r.id)}
              />
            ))}
          </div>
        </section>

        {/* AI Writing Tutor CTA */}
        {data.code !== "toeic" && (
          <section>
            <div className="rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/5 via-card to-accent/5 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent mb-2">
                    <Sparkles className="size-3.5" /> AI-Powered
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight mb-1">
                    Practice writing with instant AI feedback
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Get examiner-grade analysis, grammar fixes, vocabulary upgrades, and band
                    scoring on {exam.name} writing tasks.
                  </p>
                </div>
                <Button asChild size="lg" className="shrink-0">
                  <Link
                    to="/writing"
                    search={{ exam: data.code === "ielts" ? "ielts_task2" : data.code }}
                  >
                    Open writing tutor <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
