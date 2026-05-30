import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import {
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  Flame,
  Trophy,
  ArrowRight,
  Calendar,
  Loader2,
  Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getWordOfTheDay, getDailyMiniTest } from "@/services/gemini.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PassAsistant" },
      {
        name: "description",
        content: "Track your English exam prep progress across all four skills.",
      },
    ],
  }),
  component: Dashboard,
});

const skills = [
  {
    icon: Headphones,
    name: "Listening",
    score: null as number | null,
    label: "Audio cues captured",
    to: "/listening",
  },
  {
    icon: BookOpen,
    name: "Reading",
    score: null as number | null,
    label: "Comprehension rate",
    to: "/reading",
  },
  {
    icon: PenLine,
    name: "Writing",
    score: null as number | null,
    label: "Syntactic accuracy",
    to: "/writing",
  },
  {
    icon: Mic,
    name: "Speaking",
    score: null as number | null,
    label: "Pronunciation match",
    to: "/examiner",
  },
];

function Dashboard() {
  // Word of the Day state
  const [wordData, setWordData] = useState<{
    word: string;
    phonetic: string;
    partOfSpeech: string;
    definition: string;
    example: string;
  } | null>(null);
  const [wordLoading, setWordLoading] = useState(true);

  // Daily Mini Test state
  const [quizQuestions, setQuizQuestions] = useState<
    {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[]
  >([]);
  const [quizState, setQuizState] = useState<"idle" | "loading" | "quiz" | "result">("idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);

  // Load Word of the Day with local cache
  useEffect(() => {
    const fetchWord = async () => {
      try {
        const today = new Date().toDateString();
        const cached = localStorage.getItem("word_of_the_day");
        const cachedDate = localStorage.getItem("word_of_the_day_date");
        if (cached && cachedDate === today) {
          setWordData(JSON.parse(cached));
          setWordLoading(false);
          return;
        }

        const data = await getWordOfTheDay();
        setWordData(data);
        localStorage.setItem("word_of_the_day", JSON.stringify(data));
        localStorage.setItem("word_of_the_day_date", today);
      } catch (err) {
        console.error("Failed to load Word of the Day:", err);
      } finally {
        setWordLoading(false);
      }
    };
    fetchWord();
  }, []);

  const startMiniTest = async () => {
    setQuizState("loading");
    try {
      const questions = await getDailyMiniTest();
      setQuizQuestions(questions);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setQuizState("quiz");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load mini-test. Please try again.");
      setQuizState("idle");
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <PageHeader
          eyebrow="Daily overview"
          title="Welcome back."
          description="Here's where you are today. Pick up where you left off, or start a fresh drill."
        />

        {/* Skill grid */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {skills.map((s) => (
            <div key={s.name} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="size-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                  <s.icon className="size-4" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {s.name}
                </div>
              </div>
              <div className="text-3xl font-semibold tracking-tight tabular-nums mb-1">
                {s.score !== null ? `${s.score}%` : "—"}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {s.score !== null ? s.label : "Practice to track"}
              </p>
              {s.to ? (
                <Button size="sm" variant="outline" asChild className="w-full">
                  <Link to={s.to}>
                    Practice <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled className="w-full">
                  Coming soon
                </Button>
              )}
            </div>
          ))}
        </section>

        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {/* AI tutor card */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">
                  AI Tutor
                </div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Get examiner-grade feedback now
                </h2>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-lg">
              Submit any IELTS, TOEFL or TOEIC writing task. Receive a band estimate, grammar fixes,
              vocabulary upgrades and coherence notes — in seconds.
            </p>
            <div className="flex gap-4">
              <Button asChild>
                <Link to="/writing">
                  Open writing tutor <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/examiner">
                  Open live speaking examiner <Mic className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Streak */}
          <div className="rounded-2xl border border-border bg-foreground text-background p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest opacity-70 mb-3">
              <Flame className="size-3.5" /> Streak
            </div>
            <div className="text-5xl font-semibold tracking-tight tabular-nums">0</div>
            <p className="text-sm opacity-70 mt-1">Start practicing to build your streak.</p>
            <div className="mt-6 grid grid-cols-7 gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 rounded-md bg-background/5 border border-background/5 opacity-30"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Daily practice */}
        <section className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Word of the Day */}
          <div className="rounded-2xl border border-border bg-card p-6 min-h-[220px]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              <Calendar className="size-3.5" /> Word of the day
            </div>
            {wordLoading ? (
              <div className="flex flex-col gap-2 animate-pulse mt-4">
                <div className="h-6 bg-muted/60 rounded w-1/3" />
                <div className="h-4 bg-muted/60 rounded w-1/4" />
                <div className="h-4 bg-muted/60 rounded w-2/3 mt-2" />
              </div>
            ) : wordData ? (
              <>
                <div className="text-2xl font-semibold tracking-tight mb-1">{wordData.word}</div>
                <p className="text-sm text-muted-foreground mb-3">
                  {wordData.phonetic} · {wordData.partOfSpeech}
                </p>
                <p className="text-sm">{wordData.definition}</p>
                <p className="text-sm text-muted-foreground italic mt-2">"{wordData.example}"</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Could not load today's word.</p>
            )}
          </div>

          {/* Daily Mini Test */}
          <div className="rounded-2xl border border-border bg-card p-6 min-h-[220px] flex flex-col justify-between">
            {quizState === "idle" && (
              <>
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    <Trophy className="size-3.5" /> Daily mini-test
                  </div>
                  <div className="text-2xl font-semibold tracking-tight mb-1">
                    5 questions · 4 min
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Mixed grammar and vocabulary, calibrated to your level.
                  </p>
                </div>
                <Button onClick={startMiniTest} variant="outline" className="w-fit">
                  Start mini-test
                </Button>
              </>
            )}

            {quizState === "loading" && (
              <div className="flex flex-col items-center justify-center py-6 h-full text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-accent mb-2" />
                <p className="text-sm">Creating your custom mini-test...</p>
              </div>
            )}

            {quizState === "quiz" && (
              <div className="flex flex-col h-full justify-between gap-4">
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase mb-2">
                    <span>Question {currentQuestionIndex + 1} of 5</span>
                    <span className="text-accent">Calibrated Quiz</span>
                  </div>
                  <p className="text-sm font-medium mb-3">
                    {quizQuestions[currentQuestionIndex].question}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {quizQuestions[currentQuestionIndex].options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => {
                          const nextAnswers = [...userAnswers, oIdx];
                          setUserAnswers(nextAnswers);
                          if (currentQuestionIndex < 4) {
                            setCurrentQuestionIndex((idx) => idx + 1);
                          } else {
                            setQuizState("result");
                          }
                        }}
                        className="text-left w-full text-sm p-3 rounded-lg border border-border bg-card hover:bg-accent/10 hover:border-accent transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => setQuizState("idle")}
                  variant="ghost"
                  size="sm"
                  className="text-xs w-fit"
                >
                  Cancel Test
                </Button>
              </div>
            )}

            {quizState === "result" && (
              <div className="h-full flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="text-lg font-bold text-accent">
                    Score:{" "}
                    {
                      userAnswers.filter((ans, idx) => ans === quizQuestions[idx].correctIndex)
                        .length
                    }
                    /5
                  </div>
                  <Button onClick={() => setQuizState("idle")} variant="outline" size="sm">
                    Try Again
                  </Button>
                </div>
                <div className="overflow-y-auto max-h-[160px] pr-2 space-y-4">
                  {quizQuestions.map((q, qIdx) => {
                    const isCorrect = userAnswers[qIdx] === q.correctIndex;
                    return (
                      <div
                        key={qIdx}
                        className="pb-3 text-sm border-b border-border/50 last:border-0"
                      >
                        <div className="font-semibold mb-1 flex items-center gap-1.5 text-xs">
                          <span className={isCorrect ? "text-emerald-500" : "text-destructive"}>
                            Q{qIdx + 1}: {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                          </span>
                        </div>
                        <p className="text-foreground/90 font-medium mb-2 text-xs">{q.question}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Your answer:{" "}
                          <span
                            className={`font-semibold ${isCorrect ? "text-emerald-500" : "text-destructive"}`}
                          >
                            {q.options[userAnswers[qIdx]]}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-[11px] text-emerald-500">
                            Correct answer:{" "}
                            <span className="font-semibold">{q.options[q.correctIndex]}</span>
                          </p>
                        )}
                        <p className="text-[11px] italic bg-muted/40 p-2 rounded mt-1 leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Word Arena */}
        <section className="mb-8">
          <Link
            to="/vocabulary"
            className="group block rounded-2xl border border-border bg-card p-6 hover:border-violet-500/30 transition-all duration-300 overflow-hidden relative"
          >
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}
            />
            <div className="flex items-start justify-between relative">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-500 mb-2">
                  <Gamepad2 className="size-3.5" /> Word Arena
                </div>
                <h2 className="text-xl font-semibold tracking-tight mb-1">
                  Learn vocabulary through games
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Flashcards, quizzes, fill-in-the-blank and word matching — master exam words while
                  having fun.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-violet-500 mt-1 shrink-0">
                Play now{" "}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </section>

        {/* Exams */}
        <section>
          <h2 className="text-xl font-semibold tracking-tight mb-4">Pick your exam</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {["ielts", "toefl", "toeic"].map((code) => (
              <Link
                key={code}
                to="/exams/$code"
                params={{ code }}
                className="rounded-2xl border border-border bg-card p-6 hover:border-accent transition-colors group"
              >
                <div className="text-2xl font-semibold tracking-tight uppercase mb-2">{code}</div>
                <p className="text-sm text-muted-foreground">
                  Overview, practice materials and full mock tests.
                </p>
                <div className="mt-4 text-sm text-accent flex items-center gap-1">
                  Open{" "}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
