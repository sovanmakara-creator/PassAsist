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
  Sparkles,
  Volume2,
  HelpCircle,
  Award,
  Globe,
  Briefcase,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getWordOfTheDay, getDailyMiniTest } from "@/services/gemini.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PassAssist" },
      {
        name: "description",
        content: "Track your English exam prep progress across all four skills.",
      },
    ],
  }),
  component: Dashboard,
});

// Reusable SVG progress circle component for visual polish
function ProgressCircle({ percentage, strokeColor }: { percentage: number; strokeColor: string }) {
  const radius = 22;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative size-14 flex items-center justify-center">
      <svg className="size-full -rotate-90">
        {/* Background circle */}
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="stroke-muted fill-none"
          strokeWidth={strokeWidth}
        />
        {/* Foreground progress circle */}
        <circle
          cx="28"
          cy="28"
          r={radius}
          className={`${strokeColor} fill-none transition-all duration-500 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-black tracking-tighter">{percentage}%</span>
    </div>
  );
}

function EmptyProgressCircle() {
  return (
    <div className="relative size-14 flex items-center justify-center">
      <svg className="size-full">
        <circle
          cx="28"
          cy="28"
          r="22"
          className="stroke-muted-foreground/30 fill-none"
          strokeWidth="2"
          strokeDasharray="4,4"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-muted-foreground">—</span>
    </div>
  );
}

// Preset scores to make the dashboard look active and polished
const skills = [
  {
    icon: Headphones,
    name: "Listening",
    score: 72,
    label: "Audio cues captured",
    to: "/listening",
    gradient: "from-blue-500 to-indigo-500",
    stroke: "stroke-indigo-500",
  },
  {
    icon: BookOpen,
    name: "Reading",
    score: 80,
    label: "Comprehension rate",
    to: "/reading",
    gradient: "from-emerald-500 to-teal-500",
    stroke: "stroke-emerald-500",
  },
  {
    icon: PenLine,
    name: "Writing",
    score: 64,
    label: "Syntactic accuracy",
    to: "/writing",
    gradient: "from-purple-500 to-pink-500",
    stroke: "stroke-purple-500",
  },
  {
    icon: Mic,
    name: "Speaking",
    score: null as number | null,
    label: "Pronunciation match",
    to: "/examiner",
    gradient: "from-amber-500 to-orange-500",
    stroke: "stroke-amber-500",
  },
];

// Global reference to prevent Chrome garbage collection bug with SpeechSynthesis
let currentUtterance: SpeechSynthesisUtterance | null = null;

function Dashboard() {
  const { user } = useAuth();
  // Word of the Day state
  const [wordData, setWordData] = useState<{
    word: string;
    phonetic: string;
    partOfSpeech: string;
    definition: string;
    example: string;
    expiresAt: number;
  } | null>(null);
  const [wordLoading, setWordLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

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

  // Load Word of the Day with local cache and automatic midnight update
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const fetchWord = async () => {
      try {
        const cached = localStorage.getItem("word_of_the_day");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed.expiresAt === "number" && Date.now() < parsed.expiresAt) {
              setWordData(parsed);
              setWordLoading(false);
              
              // Set up timeout to auto-update when this cached word expires
              const delay = parsed.expiresAt - Date.now();
              timeoutId = setTimeout(() => {
                setWordLoading(true);
                fetchWordDirect();
              }, delay);
              return;
            }
          } catch (e) {
            console.warn("Invalid cached word structure, clearing:", e);
            localStorage.removeItem("word_of_the_day");
          }
        }

        await fetchWordDirect();
      } catch (err) {
        console.error("Failed to load Word of the Day:", err);
        setWordLoading(false);
      }
    };

    const fetchWordDirect = async () => {
      try {
        const data = await getWordOfTheDay();
        setWordData(data);
        localStorage.setItem("word_of_the_day", JSON.stringify(data));
        setWordLoading(false);

        // Schedule next automatic update at the returned expiresAt
        const delay = data.expiresAt - Date.now();
        if (delay > 0) {
          timeoutId = setTimeout(() => {
            setWordLoading(true);
            fetchWordDirect();
          }, delay);
        }
      } catch (err) {
        console.error("Failed to fetch Word of the Day directly:", err);
        setWordLoading(false);
      }
    };

    fetchWord();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
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

  // Speaks today's word using Web Speech API TTS
  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      // Clear any stuck state synchronously
      window.speechSynthesis.cancel();
      
      currentUtterance = new SpeechSynthesisUtterance(word);
      currentUtterance.lang = "en-US";
      currentUtterance.rate = 0.9; // Slightly slower for clarity
      
      // Try to find a high-quality English voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const enVoice = voices.find(v => v.lang.startsWith("en-") && v.localService) || voices.find(v => v.lang.startsWith("en-"));
        if (enVoice) {
          currentUtterance.voice = enVoice;
        }
      }

      // Speak synchronously so it registers as a direct user action
      window.speechSynthesis.speak(currentUtterance);
      
      // If the engine got stuck in a paused state, force it to resume
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      toast.success("Playing pronunciation...");
    } else {
      toast.error("Audio pronunciation is not supported in this browser.");
    }
  };

  // Streak details
  const streakDays = [
    { day: "M", active: true },
    { day: "T", active: true },
    { day: "W", active: true },
    { day: "T", active: false },
    { day: "F", active: false },
    { day: "S", active: false },
    { day: "S", active: false },
  ];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in md:px-6">
        <PageHeader
          eyebrow="Daily Overview"
          title={user?.user_metadata?.full_name ? `Welcome back, ${user.user_metadata.full_name.split(' ')[0]}.` : "Welcome back."}
          description="Here is where you stand today. Resume practice to lock in your targets."
        />

        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. AI Tutor glass card (lg:col-span-2) */}
          <div className="lg:col-span-2 rounded-3xl border border-border/80 bg-card p-6 md:p-8 hover-glow shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            {/* Ambient background glow inside the card */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/8 blur-3xl rounded-full pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                  <Sparkles className="size-3.5 text-accent animate-pulse" />
                  AI Tutor Evaluator
                </div>
                <div className="flex items-center gap-1">
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Live Feedback</span>
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight font-heading mb-3">
                Get examiner-grade feedback in seconds
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mb-6">
                Practice writing and speaking with instant grammar checking, vocabulary enhancements,
                coherence evaluation, and automated band scoring.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 mt-auto">
              <Button className="rounded-xl h-11 shadow-lg shadow-accent/20 hover:scale-[1.02] transition-transform" asChild>
                <Link to="/writing">
                  Open Writing Tutor <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button className="rounded-xl h-11" variant="outline" asChild>
                <Link to="/examiner">
                  Start Speaking Exam <Mic className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* 2. Premium Streak Card (lg:col-span-1) */}
          <div className="rounded-3xl border border-border/80 bg-slate-900 text-slate-100 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden hover-lift min-h-[220px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-2xl rounded-full" />
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-orange-400">
                  <Flame className="size-4 text-orange-500 animate-bounce" /> Weekly Streak
                </div>
                <span className="text-xs bg-white/10 text-orange-300 font-bold px-2 py-0.5 rounded-full">Level Active</span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-6xl font-black font-heading tracking-tighter text-transparent bg-clip-text bg-gradient-to-tr from-orange-500 to-amber-400">3</span>
                <span className="text-lg font-bold text-slate-350">days active</span>
              </div>
              <p className="text-xs text-slate-350 mt-1.5">You are doing great! Keep practicing daily to maintain it.</p>
            </div>
            
            <div className="mt-6 flex justify-between items-center gap-1">
              {streakDays.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all duration-300 ${
                      d.active
                        ? "bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/20"
                        : "bg-white/5 border border-white/10 text-slate-400"
                    }`}
                  >
                    {d.day}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Skill Cards Banner (lg:col-span-3) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:col-span-3">
            {skills.map((s) => (
              <div key={s.name} className="rounded-2xl border border-border/80 bg-card p-5 hover-lift hover-glow shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`size-10 rounded-xl bg-gradient-to-tr ${s.gradient} text-white flex items-center justify-center shadow-md`}>
                      <s.icon className="size-5" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                      {s.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 my-2">
                    {s.score !== null ? (
                      <ProgressCircle percentage={s.score} strokeColor={s.stroke} />
                    ) : (
                      <EmptyProgressCircle />
                    )}
                    <div>
                      <div className="text-xl font-bold tracking-tight">
                        {s.score !== null ? `${s.score}%` : "No Record"}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {s.score !== null ? s.label : "Practice to track score"}
                      </p>
                    </div>
                  </div>
                </div>
                
                {s.to ? (
                  <Button size="sm" variant="ghost" asChild className="w-full mt-4 hover:bg-muted font-semibold group rounded-xl">
                    <Link to={s.to}>
                      Practice Skill <ArrowRight className="ml-1 size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" disabled className="w-full mt-4 rounded-xl">
                    Coming Soon
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* 4. Word of the Day (lg:col-span-1) with Flip & TTS */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-md relative overflow-hidden flex flex-col justify-between hover-glow min-h-[260px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 blur-xl rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Calendar className="size-3.5" /> Word of the day
                </div>
                {wordData && (
                  <button 
                    onClick={() => speakWord(wordData.word)}
                    className="p-1.5 rounded-full hover:bg-muted text-accent active:scale-90 transition-transform cursor-pointer" 
                    title="Listen pronunciation"
                  >
                    <Volume2 className="size-4" />
                  </button>
                )}
              </div>

              {wordLoading ? (
                <div className="flex flex-col gap-2 animate-pulse mt-4">
                  <div className="h-6 bg-muted/65 rounded w-1/3" />
                  <div className="h-4 bg-muted/65 rounded w-1/4" />
                  <div className="h-4 bg-muted/65 rounded w-2/3 mt-2" />
                </div>
              ) : wordData ? (
                <div className="relative min-h-[110px]">
                  {!isFlipped ? (
                    <div className="transition-all duration-300">
                      <div className="text-3xl font-extrabold tracking-tight mb-1 font-heading">{wordData.word}</div>
                      <p className="text-xs font-semibold text-accent mb-3">
                        {wordData.phonetic} · <span className="italic">{wordData.partOfSpeech}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">Click the button below to review the meaning and study examples.</p>
                    </div>
                  ) : (
                    <div className="transition-all duration-300 animate-fade-in">
                      <div className="text-xs font-bold uppercase tracking-wider text-accent mb-1">Definition</div>
                      <p className="text-xs font-medium text-foreground mb-3">{wordData.definition}</p>
                      <div className="text-[11px] text-muted-foreground italic bg-muted/40 p-2.5 rounded-xl border border-border/40">
                        "{wordData.example}"
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Could not load today's word.</p>
              )}
            </div>

            {wordData && (
              <Button 
                onClick={() => setIsFlipped(!isFlipped)} 
                variant="outline" 
                size="sm" 
                className="w-full mt-4 rounded-xl"
              >
                {isFlipped ? "Show Word Overview" : "Reveal Definition & Example"}
              </Button>
            )}
          </div>

          {/* 5. Daily Mini Test Card (lg:col-span-2) */}
          <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-md flex flex-col justify-between min-h-[260px]">
            {quizState === "idle" && (
              <>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    <Trophy className="size-3.5 text-accent" /> Daily assessment
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight font-heading mb-1.5">
                    5 questions · 4 min
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                    Test your English vocabulary and core grammar skills with standard examiner multiple-choice drills calibrated to your level.
                  </p>
                </div>
                <Button onClick={startMiniTest} className="w-fit mt-4 rounded-xl h-10 px-5 bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/15">
                  Start Mini-Test
                </Button>
              </>
            )}

            {quizState === "loading" && (
              <div className="flex flex-col items-center justify-center py-8 h-full text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-accent mb-2" />
                <p className="text-sm font-medium">Creating your custom test questions...</p>
              </div>
            )}

            {quizState === "quiz" && (
              <div className="flex flex-col h-full justify-between gap-4 w-full">
                <div>
                  <div className="flex justify-between items-center text-xs font-extrabold text-muted-foreground uppercase mb-3">
                    <span>Question {currentQuestionIndex + 1} of 5</span>
                    <span className="text-accent bg-accent/10 px-2 py-0.5 rounded-full">Assessment</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-border rounded-full h-1.5 mb-4 overflow-hidden">
                    <div 
                      className="bg-accent h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${(currentQuestionIndex / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm font-bold mb-4 leading-relaxed">
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
                        className="text-left w-full text-xs p-3.5 rounded-xl border border-border bg-card hover:bg-accent/5 hover:border-accent transition-all duration-150 active:scale-[0.99] font-medium"
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
                  className="text-xs w-fit text-destructive hover:bg-destructive/10 rounded-xl"
                >
                  Cancel Test
                </Button>
              </div>
            )}

            {quizState === "result" && (
              <div className="h-full flex flex-col justify-between gap-4 w-full">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <div className="text-xs font-extrabold text-muted-foreground uppercase">Evaluation Completed</div>
                    <div className="text-lg font-black text-accent mt-0.5">
                      Your Score:{" "}
                      {
                        userAnswers.filter((ans, idx) => ans === quizQuestions[idx].correctIndex)
                          .length
                      }
                      /5
                    </div>
                  </div>
                  <Button onClick={() => setQuizState("idle")} variant="outline" size="sm" className="rounded-xl">
                    Try Again
                  </Button>
                </div>
                <div className="overflow-y-auto max-h-[160px] pr-2 space-y-4">
                  {quizQuestions.map((q, qIdx) => {
                    const isCorrect = userAnswers[qIdx] === q.correctIndex;
                    return (
                      <div
                        key={qIdx}
                        className="pb-3 text-xs border-b border-border/50 last:border-0"
                      >
                        <div className="font-bold mb-1.5 flex items-center gap-1.5">
                          <span className={isCorrect ? "text-emerald-500" : "text-destructive"}>
                            Q{qIdx + 1}: {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                          </span>
                        </div>
                        <p className="text-foreground/90 font-semibold mb-2">{q.question}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Your answer:{" "}
                          <span
                            className={`font-semibold ${isCorrect ? "text-emerald-500" : "text-destructive"}`}
                          >
                            {q.options[userAnswers[qIdx]]}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-[11px] text-emerald-500 mt-0.5">
                            Correct answer:{" "}
                            <span className="font-semibold">{q.options[q.correctIndex]}</span>
                          </p>
                        )}
                        <div className="text-[11px] italic bg-muted/40 p-2.5 rounded-xl border border-border/40 mt-1.5 leading-relaxed">
                          {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. Word Arena Promo (lg:col-span-3) */}
        <section className="mt-8">
          <Link
            to="/vocabulary"
            className="group block rounded-3xl border border-border bg-card p-6 hover:border-violet-500/30 transition-all duration-300 overflow-hidden relative shadow-md hover-glow"
          >
            {/* Gradient accent overlay inside */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.06]"
              style={{ background: "linear-gradient(135deg, var(--accent), #c084fc)" }}
            />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Gamepad2 className="size-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-violet-500 mb-1">
                    Arena Mini-Game
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight font-heading mb-1 text-foreground">
                    Learn vocabulary through games
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
                    Explore interactive flashcards, vocabulary match ups, fill-in-the-blanks, and competitive word games calibrated to boost exam scores.
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-violet-500 mt-1 shrink-0 bg-violet-500/10 px-3 py-1.5 rounded-full group-hover:bg-violet-500/25 transition-all">
                Play now{" "}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        </section>

        {/* 7. Pick Your Exam Targets */}
        <section className="mt-8">
          <h2 className="text-xl font-bold tracking-tight mb-4 font-heading">Pick your exam syllabus</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {["ielts", "toefl", "toeic"].map((code) => {
              const examName = code.toUpperCase();
              const colors = 
                examName === "IELTS" 
                  ? "border-l-4 border-l-violet-500 bg-violet-500/5" 
                  : examName === "TOEFL" 
                  ? "border-l-4 border-l-amber-500 bg-amber-500/5" 
                  : "border-l-4 border-l-teal-500 bg-teal-500/5";

              return (
                <Link
                  key={code}
                  to="/exams/$code"
                  params={{ code }}
                  className={`rounded-2xl border border-border p-6 hover-lift hover-glow shadow-sm flex flex-col justify-between group ${colors}`}
                >
                  <div>
                    <span className="text-2xl font-black tracking-tight font-heading text-foreground">{examName}</span>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Overview, practice worksheets, and standard full-length diagnostic exams.
                    </p>
                  </div>
                  <div className="mt-4 text-xs font-semibold text-accent flex items-center gap-1">
                    Open exam prep portal
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
