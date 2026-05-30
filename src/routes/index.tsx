import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  BarChart3,
  Zap,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PassAsistant — IELTS, TOEFL & TOEIC prep with an AI tutor" },
      {
        name: "description",
        content:
          "Personalized English exam prep with real-time AI feedback on writing, speaking, reading and listening. Practice IELTS, TOEFL and TOEIC with an AI tutor.",
      },
    ],
  }),
  component: Landing,
});

const skills = [
  {
    icon: Headphones,
    name: "Listening",
    desc: "Audio passages with adaptive comprehension drills.",
  },
  {
    icon: BookOpen,
    name: "Reading",
    desc: "Long-form passages, keyword highlighting, timed practice.",
  },
  { icon: PenLine, name: "Writing", desc: "Real-time AI grammar, vocab and band-score feedback." },
  { icon: Mic, name: "Speaking", desc: "Voice practice with fluency and pronunciation analysis." },
];

const exams = [
  { code: "IELTS", desc: "Academic & General. 4 skills, band 0–9.", scale: "Band 9.0" },
  { code: "TOEFL", desc: "iBT writing, integrated tasks, 0–30 per skill.", scale: "120 pts" },
  { code: "TOEIC", desc: "Listening & Reading workplace English, 10–990.", scale: "990 pts" },
];

function Landing() {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">
              Pass<span className="text-accent">Asistant</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
            <Sparkles className="size-3.5 text-accent" />
            AI-powered IELTS · TOEFL · TOEIC coaching
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight max-w-4xl leading-[1.05]">
            Score higher. With a tutor that <span className="text-accent">learns you</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            Practice writing, speaking, reading and listening with instant, examiner-grade AI
            feedback. Personalized study plans, daily drills, full mock tests.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/auth">
                Start free <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/writing">Try the AI writing tutor</Link>
            </Button>
          </div>
        </section>

        {/* Exams */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid md:grid-cols-3 gap-4">
            {exams.map((e) => (
              <div key={e.code} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-2xl font-semibold tracking-tight">{e.code}</div>
                  <div className="text-xs font-medium text-muted-foreground">{e.scale}</div>
                </div>
                <p className="text-sm text-muted-foreground">{e.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Skills grid */}
        <section className="bg-surface border-y border-border py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">
                Four core skills
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Train every part of the exam.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {skills.map((s) => (
                <div key={s.name} className="rounded-2xl border border-border bg-card p-6">
                  <div className="size-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-4">
                    <s.icon className="size-5" />
                  </div>
                  <div className="font-medium mb-1">{s.name}</div>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI feature highlight */}
        <section className="max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">
              AI tutor
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Real-time feedback that feels like a private examiner.
            </h2>
            <p className="text-muted-foreground mb-6">
              Submit any IELTS, TOEFL or TOEIC writing task and get instant grammar correction,
              vocabulary upgrades, coherence analysis and an estimated band score.
            </p>
            <ul className="space-y-3 text-sm">
              {[
                "Estimated band score with examiner reasoning",
                "Inline grammar fixes with explanations",
                "Smarter vocabulary and collocation suggestions",
                "Coherence & cohesion analysis",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Zap className="size-4 text-accent mt-0.5 shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button asChild>
                <Link to="/writing">
                  Try writing tutor <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Sample feedback
            </div>
            <div className="rounded-xl border border-border bg-surface p-4 mb-4">
              <div className="text-xs text-muted-foreground mb-1">Estimated band</div>
              <div className="text-4xl font-semibold tracking-tight">7.0</div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs font-medium text-accent mb-1">Grammar</div>
                <div className="text-muted-foreground line-through">
                  It is depend on the situation.
                </div>
                <div>It depends on the situation.</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs font-medium text-accent mb-1">Vocabulary</div>
                <div className="text-muted-foreground">
                  <span className="line-through">very important</span> →{" "}
                  <span className="text-foreground font-medium">crucial</span>
                </div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs font-medium text-accent mb-1">Coherence</div>
                <div className="text-muted-foreground">
                  Add a clearer thesis in the introduction and use linking words to bridge paragraph
                  2 and 3.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats / progress strip */}
        <section className="bg-foreground text-background">
          <div className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-3 gap-8">
            {[
              { v: "4 skills", l: "Listening · Reading · Writing · Speaking" },
              { v: "Daily", l: "Word of the day & mini-tests" },
              { v: "Mock tests", l: "Timed full-length exams" },
            ].map((s) => (
              <div key={s.v}>
                <div className="text-3xl font-semibold tracking-tight">{s.v}</div>
                <div className="text-sm opacity-70 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <BarChart3 className="size-10 text-accent mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-2xl mx-auto">
            Your next score starts today.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Free to start. Practice as much as you want.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link to="/auth">Create your account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>© {new Date().getFullYear()} PassAsistant</div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/about" className="hover:text-foreground transition-colors">
              About Us
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              Contact Us
            </Link>
            <Link to="/portfolio" className="hover:text-foreground transition-colors">
              Creator
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
          <div>Built for serious learners.</div>
        </div>
      </footer>
    </div>
  );
}
