import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  TrendingUp,
  Award,
  Compass,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
  ListTodo,
} from "lucide-react";
import { progressTracker, TestScore, WritingScore, SpeakingScore } from "@/services/progress-tracker";
import { Button } from "@/components/ui/button";

type SkillTab = "listening" | "reading" | "writing" | "speaking";

export function DashboardInsights() {
  const [activeSkill, setActiveSkill] = useState<SkillTab>("listening");
  const [listeningScores, setListeningScores] = useState<TestScore[]>([]);
  const [readingScores, setReadingScores] = useState<TestScore[]>([]);
  const [writingScores, setWritingScores] = useState<WritingScore[]>([]);
  const [speakingScores, setSpeakingScores] = useState<SpeakingScore[]>([]);

  useEffect(() => {
    setListeningScores(progressTracker.getListeningScores());
    setReadingScores(progressTracker.getReadingScores());
    setWritingScores(progressTracker.getWritingScores());
    setSpeakingScores(progressTracker.getSpeakingScores());
  }, []);

  // Helpers for calculation
  const getAveragePercent = (scores: TestScore[]) => {
    if (scores.length === 0) return null;
    const sum = scores.reduce((acc, curr) => acc + (curr.score / curr.total) * 100, 0);
    return Math.round(sum / scores.length);
  };

  const getWritingAverage = () => {
    if (writingScores.length === 0) return null;
    const sum = writingScores.reduce((acc, curr) => acc + curr.bandScore, 0);
    return Math.round((sum / writingScores.length) * 10) / 10;
  };

  const getSpeakingAverage = () => {
    if (speakingScores.length === 0) return null;
    const sum = speakingScores.reduce((acc, curr) => acc + curr.bandScore, 0);
    return Math.round((sum / speakingScores.length) * 10) / 10;
  };

  // CEFR mapping helper
  const getCefrLevel = (skill: SkillTab) => {
    if (skill === "listening") {
      const avg = getAveragePercent(listeningScores);
      if (avg === null) return null;
      if (avg >= 90) return { level: "C2", desc: "Mastery (Native-like)", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
      if (avg >= 75) return { level: "C1", desc: "Advanced Professional", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" };
      if (avg >= 60) return { level: "B2", desc: "Upper-Intermediate", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" };
      if (avg >= 45) return { level: "B1", desc: "Intermediate Scholar", color: "text-pink-500 bg-pink-500/10 border-pink-500/20" };
      if (avg >= 30) return { level: "A2", desc: "Elementary Learner", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
      return { level: "A1", desc: "Beginner", color: "text-red-500 bg-red-500/10 border-red-500/20" };
    }

    if (skill === "reading") {
      const avg = getAveragePercent(readingScores);
      if (avg === null) return null;
      if (avg >= 90) return { level: "C2", desc: "Mastery (Native-like)", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
      if (avg >= 75) return { level: "C1", desc: "Advanced Professional", color: "text-teal-500 bg-teal-500/10 border-teal-500/20" };
      if (avg >= 60) return { level: "B2", desc: "Upper-Intermediate", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
      if (avg >= 45) return { level: "B1", desc: "Intermediate Scholar", color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20" };
      if (avg >= 30) return { level: "A2", desc: "Elementary Learner", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
      return { level: "A1", desc: "Beginner", color: "text-red-500 bg-red-500/10 border-red-500/20" };
    }

    if (skill === "writing") {
      if (writingScores.length === 0) return null;
      const avg = getWritingAverage();
      if (avg === null) return null;
      // Normalise based on exam type of last entry
      const examType = writingScores[writingScores.length - 1].exam;
      if (examType.includes("ielts")) {
        if (avg >= 8.5) return { level: "C2", desc: "Mastery (Band 8.5-9.0)", color: "text-pink-500 bg-pink-500/10 border-pink-500/20" };
        if (avg >= 7.0) return { level: "C1", desc: "Advanced (Band 7.0-8.0)", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" };
        if (avg >= 5.5) return { level: "B2", desc: "Upper-Intermediate (Band 5.5-6.5)", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" };
        if (avg >= 4.5) return { level: "B1", desc: "Intermediate (Band 4.5-5.0)", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
        return { level: "A2", desc: "Elementary (Band 4.0 or lower)", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
      } else if (examType.includes("toefl")) {
        if (avg >= 28) return { level: "C2", desc: "Mastery (28-30 pts)", color: "text-pink-500 bg-pink-500/10 border-pink-500/20" };
        if (avg >= 24) return { level: "C1", desc: "Advanced (24-27 pts)", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" };
        if (avg >= 18) return { level: "B2", desc: "Upper-Intermediate (18-23 pts)", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" };
        if (avg >= 12) return { level: "B1", desc: "Intermediate (12-17 pts)", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
        return { level: "A2", desc: "Elementary (under 12 pts)", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
      } else {
        // TOEIC
        if (avg >= 180) return { level: "C2", desc: "Mastery (180-200 pts)", color: "text-pink-500 bg-pink-500/10 border-pink-500/20" };
        if (avg >= 150) return { level: "C1", desc: "Advanced (150-170 pts)", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" };
        if (avg >= 120) return { level: "B2", desc: "Upper-Intermediate (120-140 pts)", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" };
        if (avg >= 90) return { level: "B1", desc: "Intermediate (90-110 pts)", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
        return { level: "A2", desc: "Elementary (under 90 pts)", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
      }
    }

    if (skill === "speaking") {
      if (speakingScores.length === 0) return null;
      const avg = getSpeakingAverage();
      if (avg === null) return null;
      const examType = speakingScores[speakingScores.length - 1].exam;
      if (examType.includes("ielts")) {
        if (avg >= 8.5) return { level: "C2", desc: "Mastery (Band 8.5-9.0)", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
        if (avg >= 7.0) return { level: "C1", desc: "Advanced (Band 7.0-8.0)", color: "text-orange-500 bg-orange-500/10 border-orange-500/20" };
        if (avg >= 5.5) return { level: "B2", desc: "Upper-Intermediate (Band 5.5-6.5)", color: "text-red-500 bg-red-500/10 border-red-500/20" };
        if (avg >= 4.5) return { level: "B1", desc: "Intermediate (Band 4.5-5.0)", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" };
        return { level: "A2", desc: "Elementary (Band 4.0 or lower)", color: "text-pink-500 bg-pink-500/10 border-pink-500/20" };
      } else if (examType.includes("toefl")) {
        if (avg >= 28) return { level: "C2", desc: "Mastery (28-30 pts)", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
        if (avg >= 24) return { level: "C1", desc: "Advanced (24-27 pts)", color: "text-orange-500 bg-orange-500/10 border-orange-500/20" };
        if (avg >= 18) return { level: "B2", desc: "Upper-Intermediate (18-23 pts)", color: "text-red-500 bg-red-500/10 border-red-500/20" };
        if (avg >= 12) return { level: "B1", desc: "Intermediate (12-17 pts)", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" };
        return { level: "A2", desc: "Elementary (under 12 pts)", color: "text-pink-500 bg-pink-500/10 border-pink-500/20" };
      } else {
        if (avg >= 180) return { level: "C2", desc: "Mastery (180-200 pts)", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
        if (avg >= 150) return { level: "C1", desc: "Advanced (150-170 pts)", color: "text-orange-500 bg-orange-500/10 border-orange-500/20" };
        if (avg >= 120) return { level: "B2", desc: "Upper-Intermediate (120-140 pts)", color: "text-red-500 bg-red-500/10 border-red-500/20" };
        if (avg >= 90) return { level: "B1", desc: "Intermediate (90-110 pts)", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" };
        return { level: "A2", desc: "Elementary (under 90 pts)", color: "text-pink-500 bg-pink-500/10 border-pink-500/20" };
      }
    }

    return null;
  };

  const lCefr = getCefrLevel("listening");
  const rCefr = getCefrLevel("reading");
  const wCefr = getCefrLevel("writing");
  const sCefr = getCefrLevel("speaking");

  // Overall CEFR calculation
  const getOverallCefr = () => {
    const levels = [lCefr?.level, rCefr?.level, wCefr?.level, sCefr?.level].filter(Boolean) as string[];
    if (levels.length === 0) return null;

    const levelPoints: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
    const pointsList = levels.map((l) => levelPoints[l] || 1);
    const avgPoints = Math.round(pointsList.reduce((a, b) => a + b, 0) / pointsList.length);

    const pointsToLevel = ["-", "A1", "A2", "B1", "B2", "C1", "C2"];
    const overallLevel = pointsToLevel[avgPoints] || "B1";

    const descs: Record<string, string> = {
      A1: "Basic English User",
      A2: "Elementary English Speaker",
      B1: "Intermediate Learner",
      B2: "Independent Communicator",
      C1: "Advanced English Practitioner",
      C2: "Master Academic Speaker",
    };

    return { level: overallLevel, desc: descs[overallLevel] };
  };

  const overallCefr = getOverallCefr();

  // Unified lists of strengths and improvements extracted from AI feedback
  const getWritingFeedbackHistory = () => {
    const strengths = new Set<string>();
    const improvements = new Set<string>();
    const grammarIssues: string[] = [];

    writingScores.forEach((s) => {
      s.feedback?.strengths?.forEach((st) => strengths.add(st));
      s.feedback?.improvements?.forEach((im) => improvements.add(im));
      s.feedback?.grammar_issues?.forEach((gi) => {
        grammarIssues.push(`${gi.original} → ${gi.correction} (${gi.explanation})`);
      });
    });

    return {
      strengths: Array.from(strengths).slice(0, 5),
      improvements: Array.from(improvements).slice(0, 5),
      grammarIssues: grammarIssues.slice(0, 4),
    };
  };

  const getSpeakingFeedbackHistory = () => {
    const strengths = new Set<string>();
    const improvements = new Set<string>();

    speakingScores.forEach((s) => {
      s.feedback?.strengths?.forEach((st) => strengths.add(st));
      s.feedback?.improvements?.forEach((im) => improvements.add(im));
    });

    return {
      strengths: Array.from(strengths).slice(0, 5),
      improvements: Array.from(improvements).slice(0, 5),
    };
  };

  const writingHistory = getWritingFeedbackHistory();
  const speakingHistory = getSpeakingFeedbackHistory();

  // Render Skill Tabs Header
  const skillsConfig = [
    { key: "listening" as const, label: "Listening", icon: Headphones, color: "text-indigo-500", border: "border-indigo-500/20", activeBg: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30" },
    { key: "reading" as const, label: "Reading", icon: BookOpen, color: "text-emerald-500", border: "border-emerald-500/20", activeBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
    { key: "writing" as const, label: "Writing", icon: PenLine, color: "text-purple-500", border: "border-purple-500/20", activeBg: "bg-purple-500/10 text-purple-500 border-purple-500/30" },
    { key: "speaking" as const, label: "Speaking", icon: Mic, color: "text-amber-500", border: "border-amber-500/20", activeBg: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Global Overview Header Card */}
      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 hover-glow shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-3xl rounded-full pointer-events-none" />
        <div className="space-y-3 relative z-10 max-w-xl">
          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-accent bg-accent/10 px-2.5 py-1 rounded-full w-fit">
            <Compass className="size-3.5 text-accent" />
            AI Global Profile Estimation
          </div>
          {overallCefr ? (
            <div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                Your Estimated Overall CEFR level is{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-purple-500 to-indigo-500">
                  {overallCefr.level}
                </span>
              </h3>
              <p className="text-sm font-semibold text-muted-foreground mt-1">
                Proficiency Classification: {overallCefr.desc}
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                This is dynamically calculated based on your completed exercises. Practicing more will refine the precision of this estimation.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">
                No performance data recorded yet
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                Complete listening worksheets, reading passages, or submit essays and speaking records to map your progress.
              </p>
            </div>
          )}
        </div>

        {overallCefr && (
          <div className="flex items-center gap-4 bg-muted/30 border border-border/80 px-6 py-5 rounded-2xl shrink-0 shadow-inner w-full md:w-auto justify-center md:justify-start">
            <Award className="size-10 text-accent" />
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground block">
                Certificate Ready
              </span>
              <span className="text-lg font-bold text-foreground">
                CEFR {overallCefr.level} Level Achieved
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Skill Tabs Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {skillsConfig.map((item) => {
          const isActive = activeSkill === item.key;
          const Icon = item.icon;
          let counts = 0;
          if (item.key === "listening") counts = listeningScores.length;
          if (item.key === "reading") counts = readingScores.length;
          if (item.key === "writing") counts = writingScores.length;
          if (item.key === "speaking") counts = speakingScores.length;

          return (
            <button
              key={item.key}
              onClick={() => setActiveSkill(item.key)}
              className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isActive
                  ? item.activeBg + " shadow-md shadow-accent/5 scale-[1.01] font-bold"
                  : "bg-card border-border hover:bg-muted/50 hover:border-border/80"
              }`}
            >
              <div className={`p-2 rounded-xl bg-muted/40 border ${item.border}`}>
                <Icon className={`size-5 ${item.color}`} />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wide block text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {counts} {counts === 1 ? "activity" : "activities"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Skill Details Panel */}
      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-md">
        {activeSkill === "listening" && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Level Reached</span>
                <span className="text-3xl font-black text-indigo-500 mt-2 block">
                  {lCefr ? lCefr.level : "—"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {lCefr ? lCefr.desc : "No listening test completed"}
                </span>
              </div>
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Average Score</span>
                <span className="text-3xl font-black text-indigo-500 mt-2 block">
                  {getAveragePercent(listeningScores) !== null ? `${getAveragePercent(listeningScores)}%` : "—"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Across all completed tasks
                </span>
              </div>
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Worksheets Completed</span>
                <span className="text-3xl font-black text-indigo-500 mt-2 block">
                  {listeningScores.length}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Audio tests analyzed
                </span>
              </div>
            </div>

            {listeningScores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* What's Improved */}
                <div className="space-y-4">
                  <h4 className="font-bold text-base flex items-center gap-2 text-indigo-500">
                    <CheckCircle2 className="size-5" /> What Has Been Improved
                  </h4>
                  <ul className="space-y-3 pl-1">
                    <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-emerald-500" />
                      Completed spelling-focused fill-in activities correctly.
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-emerald-500" />
                      Steady test progression over {listeningScores.length} attempts.
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-emerald-500" />
                      Familiarity with IELTS Listening Section 1 layouts.
                    </li>
                  </ul>
                </div>

                {/* What to Improve */}
                <div className="space-y-4">
                  <h4 className="font-bold text-base flex items-center gap-2 text-red-500">
                    <TrendingDown className="size-5" /> What to Improve
                  </h4>
                  <ul className="space-y-3 pl-1">
                    <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-red-400" />
                      Spelling accuracy for names, numbers, and dates.
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-red-400" />
                      Multitasking: Reading ahead while tracking audio cues.
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-red-400" />
                      Distractors: Detecting when audio speakers change their mind.
                    </li>
                  </ul>
                </div>

                {/* What to do to improve */}
                <div className="space-y-4">
                  <h4 className="font-bold text-base flex items-center gap-2 text-accent">
                    <ListTodo className="size-5" /> What to Do to Improve
                  </h4>
                  <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed pl-1">
                    <li>1. Listen to a variety of English accents (British, Australian, American).</li>
                    <li>2. Practice writing down spellings of spoken numbers/dates immediately.</li>
                    <li>3. Review incorrect answers with transcript explanations in full detail.</li>
                  </ul>
                  <Button asChild size="sm" className="w-full mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link to="/exams">Practice Another Listening Test</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border/80">
                <Compass className="size-12 mx-auto mb-3 text-muted-foreground/50 animate-pulse" />
                <h4 className="font-bold text-foreground">No listening records yet</h4>
                <p className="text-xs max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                  Start practicing standard English exam listening tests. We will record your scores and evaluate your level.
                </p>
                <Button asChild className="rounded-xl">
                  <Link to="/exams">Take Listening Test</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {activeSkill === "reading" && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Level Reached</span>
                <span className="text-3xl font-black text-emerald-500 mt-2 block">
                  {rCefr ? rCefr.level : "—"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {rCefr ? rCefr.desc : "No reading test completed"}
                </span>
              </div>
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Average Score</span>
                <span className="text-3xl font-black text-emerald-500 mt-2 block">
                  {getAveragePercent(readingScores) !== null ? `${getAveragePercent(readingScores)}%` : "—"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Across all completed tasks
                </span>
              </div>
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Passages Analyzed</span>
                <span className="text-3xl font-black text-emerald-500 mt-2 block">
                  {readingScores.length}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Comprehension tests submitted
                </span>
              </div>
            </div>

            {readingScores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* What's Improved */}
                <div className="space-y-4">
                  <h4 className="font-bold text-base flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="size-5" /> What Has Been Improved
                  </h4>
                  <ul className="space-y-3 pl-1">
                    <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-emerald-500" />
                      Strong skimming and scanning across {readingScores.length} articles.
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-emerald-500" />
                      Enhanced lexical resource by using interactive dictionary definition lookups.
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-emerald-500" />
                      Identifying core paragraph details and matching arguments.
                    </li>
                  </ul>
                </div>

                {/* What to Improve */}
                <div className="space-y-4">
                  <h4 className="font-bold text-base flex items-center gap-2 text-red-500">
                    <TrendingDown className="size-5" /> What to Improve
                  </h4>
                  <ul className="space-y-3 pl-1">
                    <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-red-400" />
                      Distinguishing between "FALSE" and "NOT GIVEN" statements.
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-red-400" />
                      Time management: Speed-reading scientific abstracts in under 20 minutes.
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                      <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-red-400" />
                      Grammatical mapping of complex sentence structures.
                    </li>
                  </ul>
                </div>

                {/* What to do to improve */}
                <div className="space-y-4">
                  <h4 className="font-bold text-base flex items-center gap-2 text-accent">
                    <ListTodo className="size-5" /> What to Do to Improve
                  </h4>
                  <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed pl-1">
                    <li>1. Read high-level news journals (The Economist, Nature) for 15 mins daily.</li>
                    <li>2. Learn to scan for keywords in reading prompts before reading paragraphs.</li>
                    <li>3. Use Word Arena game modes to expand academic vocabulary.</li>
                  </ul>
                  <Button asChild size="sm" className="w-full mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Link to="/exams">Practice Another Reading Passage</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border/80">
                <Compass className="size-12 mx-auto mb-3 text-muted-foreground/50 animate-pulse" />
                <h4 className="font-bold text-foreground">No reading records yet</h4>
                <p className="text-xs max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                  Practice Reading tests to automatically record your comprehension scores, read speed metrics, and estimated level.
                </p>
                <Button asChild className="rounded-xl">
                  <Link to="/exams">Start Reading Test</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {activeSkill === "writing" && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Level Reached</span>
                <span className="text-3xl font-black text-purple-500 mt-2 block">
                  {wCefr ? wCefr.level : "—"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {wCefr ? wCefr.desc : "No writing evaluation submitted"}
                </span>
              </div>
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Average Band Score</span>
                <span className="text-3xl font-black text-purple-500 mt-2 block">
                  {getWritingAverage() !== null ? getWritingAverage() : "—"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Calibrated to your exam scale
                </span>
              </div>
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Essays Evaluated</span>
                <span className="text-3xl font-black text-purple-500 mt-2 block">
                  {writingScores.length}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Full examiner-grade assessments
                </span>
              </div>
            </div>

            {writingScores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* What's Improved */}
                <div className="space-y-4">
                  <h4 className="font-bold text-base flex items-center gap-2 text-purple-500">
                    <CheckCircle2 className="size-5" /> What Has Been Improved
                  </h4>
                  {writingHistory.strengths.length > 0 ? (
                    <ul className="space-y-3 pl-1">
                      {writingHistory.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                          <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-emerald-500" />
                          {str}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Keep submitting essays to extract unique strengths.</p>
                  )}
                </div>

                {/* What to Improve */}
                <div className="space-y-4">
                  <h4 className="font-bold text-base flex items-center gap-2 text-red-500">
                    <TrendingDown className="size-5" /> What to Improve
                  </h4>
                  {writingHistory.improvements.length > 0 ? (
                    <ul className="space-y-3 pl-1">
                      {writingHistory.improvements.map((imp, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                          <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-red-400" />
                          {imp}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Submit more essays to isolate target areas.</p>
                  )}

                  {writingHistory.grammarIssues.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <span className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground block mb-2">
                        Common Grammar Slip-ups:
                      </span>
                      <ul className="space-y-2 text-xs text-red-400 pl-1">
                        {writingHistory.grammarIssues.map((gi, idx) => (
                          <li key={idx} className="leading-relaxed font-semibold">
                            ⚠️ {gi}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* What to do to improve */}
                <div className="space-y-4">
                  <h4 className="font-bold text-base flex items-center gap-2 text-accent">
                    <ListTodo className="size-5" /> What to Do to Improve
                  </h4>
                  <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed pl-1">
                    <li>1. Practice writing essays with a strict 40-minute limit.</li>
                    <li>2. Use academic transitional phrases to improve coherence and cohesion score.</li>
                    <li>3. Review the grammar corrections side-by-side before writing the next essay.</li>
                  </ul>
                  <Button asChild size="sm" className="w-full mt-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white">
                    <Link to="/writing">Start Writing Essay</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border/80">
                <Compass className="size-12 mx-auto mb-3 text-muted-foreground/50 animate-pulse" />
                <h4 className="font-bold text-foreground">No writing submissions yet</h4>
                <p className="text-xs max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                  Submit an essay response to a practice prompt to trigger AI evaluations. We'll analyze your coherence, lexical variety, and grammatical structures.
                </p>
                <Button asChild className="rounded-xl">
                  <Link to="/writing">Go to Writing Tutor</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {activeSkill === "speaking" && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Level Reached</span>
                <span className="text-3xl font-black text-amber-500 mt-2 block">
                  {sCefr ? sCefr.level : "—"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {sCefr ? sCefr.desc : "No speaking test completed"}
                </span>
              </div>
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Average Band Score</span>
                <span className="text-3xl font-black text-amber-500 mt-2 block">
                  {getSpeakingAverage() !== null ? getSpeakingAverage() : "—"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Calibrated to your exam scale
                </span>
              </div>
              <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sessions Conducted</span>
                <span className="text-3xl font-black text-amber-500 mt-2 block">
                  {speakingScores.length}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Live interview checks completed
                </span>
              </div>
            </div>

            {speakingScores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* What's Improved */}
                <div className="space-y-4">
                  <h4 className="font-bold text-base flex items-center gap-2 text-amber-500">
                    <CheckCircle2 className="size-5" /> What Has Been Improved
                  </h4>
                  {speakingHistory.strengths.length > 0 ? (
                    <ul className="space-y-3 pl-1">
                      {speakingHistory.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                          <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-emerald-500" />
                          {str}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Complete speaking exams to view pronunciation/fluency strengths.</p>
                  )}
                </div>

                {/* What to Improve */}
                <div className="space-y-4">
                  <h4 className="font-bold text-base flex items-center gap-2 text-red-500">
                    <TrendingDown className="size-5" /> What to Improve
                  </h4>
                  {speakingHistory.improvements.length > 0 ? (
                    <ul className="space-y-3 pl-1">
                      {speakingHistory.improvements.map((imp, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                          <span className="mt-1.5 shrink-0 size-1.5 rounded-full bg-red-400" />
                          {imp}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Complete more speaking sessions to map areas needing focus.</p>
                  )}
                </div>

                {/* What to do to improve */}
                <div className="space-y-4">
                  <h4 className="font-bold text-base flex items-center gap-2 text-accent">
                    <ListTodo className="size-5" /> What to Do to Improve
                  </h4>
                  <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed pl-1">
                    <li>1. Record yourself answering cue cards and listen to your vocal delivery.</li>
                    <li>2. Minimize pauses and filler words ("um", "like") to boost fluency scores.</li>
                    <li>3. Interact with the Live AI Examiner daily to build spoken confidence.</li>
                  </ul>
                  <div className="flex flex-col gap-2 mt-4">
                    <Button asChild size="sm" className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white">
                      <Link to="/examiner">Open Live AI Examiner</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="w-full rounded-xl">
                      <Link to="/speaking">Practice Speaking Prompts</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border/80">
                <Compass className="size-12 mx-auto mb-3 text-muted-foreground/50 animate-pulse" />
                <h4 className="font-bold text-foreground">No speaking evaluations yet</h4>
                <p className="text-xs max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                  Start speaking drills or load a full mock test in Live AI Examiner. We will evaluate your pronunciation match, lexical complexity, and grammar precision.
                </p>
                <Button asChild className="rounded-xl">
                  <Link to="/examiner">Try Live AI Examiner</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
