import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analyzeWriting, fetchNewTopic } from "@/services/writing.functions";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Shuffle,
  PenLine,
  RotateCcw,
  Timer,
  Play,
  Square,
} from "lucide-react";
import { z } from "zod";

const SearchSchema = z.object({
  exam: z.enum(["ielts_task1", "ielts_task2", "toefl", "toeic"]).optional(),
});

export const Route = createFileRoute("/writing")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "AI Writing Tutor — PassAssist" },
      {
        name: "description",
        content:
          "Real-time AI feedback on IELTS, TOEFL and TOEIC writing tasks. Grammar, vocabulary, coherence and band score.",
      },
    ],
  }),
  component: WritingPage,
});

/* ------------------------------------------------------------------ */
/*  Writing types & time limits per exam                               */
/* ------------------------------------------------------------------ */
const WRITING_TYPES: Record<string, { label: string; types: { value: string; label: string }[] }> =
  {
    ielts_task1: {
      label: "IELTS Academic Writing Task 1",
      types: [
        { value: "bar_chart", label: "Bar Chart" },
        { value: "line_graph", label: "Line Graph" },
        { value: "pie_chart", label: "Pie Chart" },
        { value: "table", label: "Table" },
        { value: "map", label: "Map" },
        { value: "process", label: "Process Diagram" },
      ],
    },
    ielts_task2: {
      label: "IELTS Writing Task 2",
      types: [
        { value: "opinion", label: "Opinion / Agree-Disagree" },
        { value: "discussion", label: "Discussion (Both Views)" },
        { value: "problem_solution", label: "Problem & Solution" },
        { value: "advantages", label: "Advantages & Disadvantages" },
        { value: "two_part", label: "Two-Part Question" },
      ],
    },
    toefl: {
      label: "TOEFL Writing",
      types: [
        { value: "independent", label: "Independent Writing" },
        { value: "integrated", label: "Integrated Writing" },
        { value: "academic_discussion", label: "Academic Discussion" },
      ],
    },
    toeic: {
      label: "TOEIC Writing",
      types: [
        { value: "opinion_essay", label: "Opinion Essay" },
        { value: "email", label: "Email Response" },
      ],
    },
  };

const TIME_LIMITS: Record<string, number> = {
  ielts_task1: 20 * 60,
  ielts_task2: 40 * 60,
  toefl: 30 * 60,
  toeic: 30 * 60,
};

const PROMPTS: Record<
  "ielts_task1" | "ielts_task2" | "toefl" | "toeic",
  { title: string; task: string }
> = {
  ielts_task1: {
    title: "IELTS Academic Writing Task 1",
    task: "You should spend about 20 minutes on this task.\n\nThe chart below shows the number of men and women in further education in Britain in three periods and whether they were studying full-time or part-time.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.",
  },
  ielts_task2: {
    title: "IELTS Writing Task 2",
    task: "You should spend about 40 minutes on this task.\n\nSome people believe that universities should focus on providing academic skills, while others think they should also prepare students for their future careers. Discuss both views and give your own opinion.\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.",
  },
  toefl: {
    title: "TOEFL Independent Writing",
    task: "Do you agree or disagree with the following statement: 'Technology has made people less creative than they were in the past.' Use specific reasons and examples to support your answer. Write at least 300 words.",
  },
  toeic: {
    title: "TOEIC Writing — Opinion Essay",
    task: "Some companies allow employees to work remotely. Do you think this is a good policy? Why or why not? Use specific reasons and examples. Write at least 300 words.",
  },
};

function formatTime(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? "-" : "";
  return `${sign}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type Feedback = Awaited<ReturnType<typeof analyzeWriting>>;

/* ------------------------------------------------------------------ */
/*  Build annotated essay with inline highlights                      */
/* ------------------------------------------------------------------ */
function buildAnnotatedEssay(essay: string, feedback: Feedback): React.ReactNode[] {
  // Collect all annotations with their positions
  type Annotation = {
    start: number;
    end: number;
    type: "grammar" | "vocab";
    original: string;
    replacement: string;
    explanation: string;
  };

  const annotations: Annotation[] = [];

  // Find grammar issues in the essay
  for (const g of feedback.grammar_issues) {
    const idx = essay.toLowerCase().indexOf(g.original.toLowerCase());
    if (idx !== -1) {
      annotations.push({
        start: idx,
        end: idx + g.original.length,
        type: "grammar",
        original: g.original,
        replacement: g.correction,
        explanation: g.explanation,
      });
    }
  }

  // Find vocabulary suggestions in the essay
  for (const v of feedback.vocabulary_suggestions) {
    const regex = new RegExp(`\\b${v.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const match = essay.match(regex);
    if (match && match.index !== undefined) {
      // Check overlap with existing annotations
      const overlaps = annotations.some(
        (a) => match.index! < a.end && match.index! + match[0].length > a.start,
      );
      if (!overlaps) {
        annotations.push({
          start: match.index,
          end: match.index + match[0].length,
          type: "vocab",
          original: v.word,
          replacement: v.better,
          explanation: v.why,
        });
      }
    }
  }

  // Sort by position
  annotations.sort((a, b) => a.start - b.start);

  // Build React nodes
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const ann of annotations) {
    // Text before this annotation
    if (cursor < ann.start) {
      nodes.push(essay.slice(cursor, ann.start));
    }

    const isGrammar = ann.type === "grammar";

    nodes.push(
      <span key={`ann-${ann.start}`} className="group relative inline">
        <span
          className={
            isGrammar
              ? "bg-red-500/15 text-red-400 line-through decoration-red-400/60 decoration-2 cursor-help"
              : "bg-amber-500/15 text-amber-400 underline decoration-amber-400/50 decoration-wavy decoration-2 cursor-help"
          }
        >
          {essay.slice(ann.start, ann.end)}
        </span>
        {/* Inline correction shown right after */}
        <span
          className={
            isGrammar
              ? "ml-1 text-emerald-400 font-medium text-xs"
              : "ml-1 text-sky-400 font-medium text-xs"
          }
        >
          → {ann.replacement}
        </span>
        {/* Tooltip on hover */}
        <span className="pointer-events-none absolute top-full left-0 mt-2 hidden group-hover:block z-50 w-64 rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-xl">
          <span className="font-semibold block mb-1">
            {isGrammar ? "Grammar fix" : "Vocabulary upgrade"}
          </span>
          <span className="block text-muted-foreground">{ann.explanation}</span>
        </span>
      </span>,
    );

    cursor = ann.end;
  }

  // Remaining text
  if (cursor < essay.length) {
    nodes.push(essay.slice(cursor));
  }

  return nodes;
}

function WritingPage() {
  const search = Route.useSearch();
  const [exam, setExam] = useState<"ielts_task1" | "ielts_task2" | "toefl" | "toeic">(
    search.exam ?? "ielts_task2",
  );
  const [writingType, setWritingType] = useState(WRITING_TYPES["ielts_task2"].types[0].value);
  const prompt = useMemo(() => PROMPTS[exam], [exam]);
  const [task, setTask] = useState(prompt.task);
  const [taskImageUrl, setTaskImageUrl] = useState<string | null>(null);
  const [recommendedWords, setRecommendedWords] = useState<{ word: string; hint: string }[]>([]);
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingTopic, setFetchingTopic] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLimit = TIME_LIMITS[exam] ?? 30 * 60;
  const remaining = timeLimit - elapsed;

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning]);

  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;

  const handleExamChange = (val: string) => {
    const v = val as "ielts_task1" | "ielts_task2" | "toefl" | "toeic";
    setExam(v);
    setWritingType(WRITING_TYPES[v].types[0].value);
    setTask(PROMPTS[v].task);
    setTaskImageUrl(null);
    setRecommendedWords([]);
    setEssay("");
    setFeedback(null);
    setTimerRunning(false);
    setElapsed(0);
  };

  const handleFetchNewTopic = async (typeOverride?: string) => {
    setFetchingTopic(true);
    try {
      const res = await fetchNewTopic({ data: { exam, writingType: typeOverride ?? writingType } });
      setTask(res.task);
      setTaskImageUrl(res.imageUrl);
      setRecommendedWords(res.recommendedWords ?? []);
      setEssay("");
      setFeedback(null);
      setTimerRunning(false);
      setElapsed(0);
      toast.success("New topic loaded!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch new topic";
      toast.error(msg);
    } finally {
      setFetchingTopic(false);
    }
  };

  // Auto-fetch when writingType changes (skip initial mount)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    handleFetchNewTopic(writingType);
  }, [writingType]);

  const submit = async () => {
    setTimerRunning(false);
    const wordCount = essay
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    if (wordCount < 50) {
      toast.error("Write at least 50 words before submitting.");
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const res = await analyzeWriting({ data: { exam, task, essay } });
      setFeedback(res);
      toast.success("Feedback ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAgain = useCallback(() => {
    setFeedback(null);
    setTimerRunning(false);
    setElapsed(0);
  }, []);

  const handleEssayChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEssay(e.target.value);
      // Auto-start timer on first keystroke
      if (!timerRunning && e.target.value.length > 0 && !feedback) {
        setTimerRunning(true);
      }
    },
    [timerRunning, feedback],
  );

  const annotatedEssay = useMemo(() => {
    if (!feedback) return null;
    return buildAnnotatedEssay(essay, feedback);
  }, [feedback, essay]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <PageHeader
          eyebrow="AI writing tutor"
          title="Write. Submit. Improve."
          description="Pick an exam, write your response, and get examiner-grade AI feedback in seconds."
        >
          <ShareButton
            title="AI Writing Tutor — PassAssist"
            description="Practice writing and get instant examiner-grade feedback in seconds."
          />
        </PageHeader>

        <Tabs value={exam} onValueChange={handleExamChange} className="mb-4">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="ielts_task1">IELTS Task 1</TabsTrigger>
            <TabsTrigger value="ielts_task2">IELTS Task 2</TabsTrigger>
            <TabsTrigger value="toefl">TOEFL</TabsTrigger>
            <TabsTrigger value="toeic">TOEIC</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Writing type sub-options */}
        <div className="flex flex-wrap gap-2 mb-6">
          {WRITING_TYPES[exam].types.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setWritingType(t.value);
              }}
              disabled={fetchingTopic}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                writingType === t.value
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: Question + Recommended vocab */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
                  <BookOpen className="size-3.5" /> {prompt.title}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleFetchNewTopic()}
                  disabled={fetchingTopic}
                >
                  {fetchingTopic ? (
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Shuffle className="size-3.5 mr-1.5" />
                  )}
                  Change Topic
                </Button>
              </div>

              {taskImageUrl && (
                <div className="mb-4 rounded-lg overflow-hidden border border-border bg-surface flex justify-center p-4">
                  <img
                    src={taskImageUrl}
                    alt="Task Chart"
                    className="max-w-full h-auto max-h-[300px] object-contain"
                  />
                </div>
              )}

              <Textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={taskImageUrl ? 4 : 6}
                className="bg-surface border-border resize-none text-sm leading-relaxed"
              />
            </div>

            {recommendedWords.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="size-4 text-accent" />
                  Recommended Vocabulary
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Use these topic-related words or phrases in your response to achieve a higher band
                  score:
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {recommendedWords.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-baseline gap-2 rounded-lg bg-accent/5 px-3 py-2 ring-1 ring-inset ring-accent/15"
                    >
                      <span className="text-sm font-semibold text-accent whitespace-nowrap">
                        {w.word}
                      </span>
                      <span className="text-xs text-muted-foreground">— {w.hint}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Response area + inline feedback */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <PenLine className="size-3.5" />
                  Your response
                </Label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {wordCount} {wordCount === 1 ? "word" : "words"}
                  </span>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold tabular-nums ${
                      remaining <= 0
                        ? "bg-red-500/15 text-red-400"
                        : remaining <= 120
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Timer className="size-3" />
                    {formatTime(remaining)}
                    {!feedback && (
                      <button
                        onClick={() =>
                          timerRunning ? setTimerRunning(false) : setTimerRunning(true)
                        }
                        className="ml-1 hover:text-foreground transition-colors"
                      >
                        {timerRunning ? <Square className="size-3" /> : <Play className="size-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Show textarea when writing, annotated text when feedback is ready */}
              {!feedback ? (
                <Textarea
                  value={essay}
                  onChange={handleEssayChange}
                  rows={20}
                  placeholder="Start writing here… timer starts automatically."
                  className="bg-surface border-border resize-none font-sans text-sm leading-relaxed"
                />
              ) : (
                <>
                  <div className="rounded-xl bg-surface border border-border p-4 text-sm leading-relaxed whitespace-pre-wrap min-h-[320px] max-h-[500px] overflow-y-auto font-sans">
                    {annotatedEssay}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded bg-red-500/20 border border-red-500/40" />
                      <span className="line-through decoration-red-400/60">Grammar</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" />
                      <span className="underline decoration-wavy decoration-amber-400/50">
                        Vocabulary
                      </span>
                    </span>
                    <span className="text-muted-foreground/60">Hover for details</span>
                  </div>
                </>
              )}

              <div className="mt-4 flex justify-between items-center">
                {feedback ? (
                  <Button variant="outline" size="sm" onClick={handleEditAgain}>
                    <RotateCcw className="mr-2 size-3.5" /> Edit & Resubmit
                  </Button>
                ) : (
                  <div />
                )}
                <Button onClick={submit} disabled={loading || !!feedback} size="lg">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-4" /> Get AI feedback
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <Loader2 className="size-6 text-accent mx-auto mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">Analyzing your response…</p>
              </div>
            )}

            {/* Feedback summary cards below the response */}
            {feedback && <FeedbackSummary feedback={feedback} exam={exam} />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Feedback summary — shown below the annotated response             */
/* ------------------------------------------------------------------ */
function FeedbackSummary({
  feedback,
  exam,
}: {
  feedback: Feedback;
  exam: "ielts_task1" | "ielts_task2" | "toefl" | "toeic";
}) {
  const scaleLabel = exam.startsWith("ielts")
    ? "Band"
    : exam === "toefl"
      ? "TOEFL writing"
      : "TOEIC writing";
  return (
    <>
      {/* Band score */}
      <div className="rounded-2xl border border-border bg-foreground text-background p-6">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">
              Estimated {scaleLabel}
            </div>
            <div className="text-5xl font-semibold tracking-tight tabular-nums">
              {feedback.band_score}
            </div>
          </div>
          <p className="text-sm opacity-80 flex-1">{feedback.overall}</p>
        </div>
      </div>

      {/* Criteria breakdown */}
      {feedback.criteria_scores && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-medium mb-4">Assessment Criteria</h3>
          <div className="space-y-4">
            {[
              { key: "task_achievement" as const, label: "Task Achievement / Response" },
              { key: "coherence_cohesion" as const, label: "Coherence & Cohesion" },
              { key: "lexical_resource" as const, label: "Lexical Resource" },
              { key: "grammatical_range" as const, label: "Grammatical Range & Accuracy" },
            ].map(({ key, label }) => {
              const criterion = feedback.criteria_scores[key];
              if (!criterion) return null;
              const pct = (criterion.score / 5) * 100;
              const color =
                criterion.score >= 4
                  ? "bg-emerald-500"
                  : criterion.score >= 3
                    ? "bg-sky-500"
                    : criterion.score >= 2
                      ? "bg-amber-500"
                      : "bg-red-500";
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm font-semibold tabular-nums">{criterion.score}/5</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{criterion.comment}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="size-4 text-success" />
            <h3 className="font-medium">Strengths</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-success">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="size-4 text-warning" />
            <h3 className="font-medium">Improvements</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-warning">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Grammar fixes - detailed list */}
      {feedback.grammar_issues.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-medium mb-3">Grammar fixes</h3>
          <div className="space-y-3">
            {feedback.grammar_issues.map((g, i) => (
              <div key={i} className="rounded-lg border border-border p-3 text-sm">
                <div className="text-muted-foreground line-through decoration-red-400/60">
                  {g.original}
                </div>
                <div className="font-medium flex items-center gap-2 mt-1 text-emerald-400">
                  <ArrowRight className="size-3.5" /> {g.correction}
                </div>
                <div className="text-xs text-muted-foreground mt-2">{g.explanation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vocabulary upgrades - detailed list */}
      {feedback.vocabulary_suggestions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-medium mb-3">Vocabulary upgrades</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {feedback.vocabulary_suggestions.map((v, i) => (
              <div key={i} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through">{v.word}</span>
                  <ArrowRight className="size-3 text-accent" />
                  <span className="font-medium">{v.better}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{v.why}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coherence */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-medium mb-2">Coherence & cohesion</h3>
        <p className="text-sm text-muted-foreground">{feedback.coherence}</p>
      </div>
    </>
  );
}
