import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  Zap,
  Award,
  Globe,
  Briefcase,
  ChevronRight,
  Star,
  Users,
  CheckCircle,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PassAssist — IELTS, TOEFL & TOEIC prep with an AI tutor" },
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
  const { user } = useAuth();
  return (
    <div className="min-h-dvh bg-background text-foreground animate-fade-in">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/80 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="size-8 rounded-lg bg-gradient-to-tr from-accent to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-accent/25 transition-transform group-hover:scale-105">
              P
            </div>
            <span className="text-lg font-bold tracking-tight">
              Pass<span className="text-accent">Assist</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="rounded-full size-9">
              {theme === "dark" ? <Sun className="size-4.5 text-amber-500" /> : <Moon className="size-4.5 text-indigo-500" />}
            </Button>
            {user ? (
              <Button size="sm" className="rounded-xl bg-accent hover:bg-accent/90 shadow-md shadow-accent/20 hover:shadow-accent/35 transition-all hover:scale-[1.02]" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button size="sm" className="rounded-xl bg-accent hover:bg-accent/90 shadow-md shadow-accent/20 hover:shadow-accent/35 transition-all hover:scale-[1.02]" asChild>
                  <Link to="/auth">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-mesh animate-mesh border-b border-border/50 py-20 md:py-28">
          {/* Animated background bubbles */}
          <div className="absolute top-1/4 left-[10%] w-96 h-96 bg-accent/8 blur-[100px] rounded-full animate-float" />
          <div className="absolute bottom-1/4 right-[10%] w-96 h-96 bg-violet-500/8 blur-[120px] rounded-full animate-float stagger-3" />

          <div className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-accent mb-6 shadow-sm">
              <Sparkles className="size-3.5 text-accent animate-pulse" />
              AI-Powered English Exam Prep Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] font-heading">
              Score higher. With a tutor that{" "}
              <span className="bg-gradient-to-r from-accent via-violet-500 to-indigo-500 bg-clip-text text-transparent animate-text-gradient bg-[length:200%_auto]">
                learns you
              </span>
              .
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed mx-auto">
              Practice writing, speaking, reading, and listening with instant, examiner-grade AI
              feedback. Personalized study plans, daily drills, and full-length mock exams.
            </p>
            
            {/* Trust Badge */}
            <div className="mt-6 flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/30 py-1.5 px-3 rounded-full border border-border/40 justify-center">
              <Users className="size-3.5 text-accent" />
              <span>Join <span className="text-foreground font-bold">12,000+</span> learners scoring higher this week</span>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" className="rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-[1.02] transition-all" asChild>
                <Link to={user ? "/dashboard" : "/auth"}>
                  {user ? "Go to Dashboard" : "Start Free Prep"} <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl hover:bg-muted/50 transition-colors" asChild>
                <Link to="/writing">Try Writing Tutor</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Exams */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-in-up">
            <h2 className="text-3xl font-extrabold tracking-tight font-heading">
              Select Your English Exam Target
            </h2>
            <p className="mt-2 text-muted-foreground text-sm">
              We specialize in the top three standardized tests with tailored AI examiners.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {exams.map((e) => {
              const colors = 
                e.code === "IELTS" 
                  ? { border: "border-l-4 border-l-violet-500", icon: Award, bg: "bg-violet-500/10 text-violet-500" }
                  : e.code === "TOEFL"
                  ? { border: "border-l-4 border-l-amber-500", icon: Globe, bg: "bg-amber-500/10 text-amber-500" }
                  : { border: "border-l-4 border-l-teal-500", icon: Briefcase, bg: "bg-teal-500/10 text-teal-500" };
              const Icon = colors.icon;
              
              return (
                <div 
                  key={e.code} 
                  className={`rounded-2xl border border-border bg-card p-6 hover-lift hover-glow shadow-sm flex flex-col justify-between ${colors.border}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                          <Icon className="size-5" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight font-heading">{e.code}</span>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground uppercase bg-muted/40 py-1 px-2.5 rounded-full">{e.scale}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{e.desc}</p>
                  </div>
                  {user ? (
                    <Link 
                      to="/exams/$code" 
                      params={{ code: e.code.toLowerCase() }}
                      className="mt-6 flex items-center text-xs font-semibold text-accent hover:underline group"
                    >
                      Start practice drills 
                      <ChevronRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </Link>
                  ) : (
                    <Link 
                      to="/auth" 
                      className="mt-6 flex items-center text-xs font-semibold text-accent hover:underline group"
                    >
                      Start practice drills 
                      <ChevronRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Skills grid */}
        <section className="bg-surface border-y border-border py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 blur-[90px] rounded-full pointer-events-none" />
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <div className="text-xs font-extrabold uppercase tracking-widest text-accent mb-2 flex items-center gap-1.5">
                <Sparkles className="size-3 text-accent animate-pulse" />
                Comprehensive Preparation
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-heading">
                Train Every Skill Required to Pass.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {skills.map((s, idx) => {
                const gradient = 
                  s.name === "Listening" ? "from-blue-500 to-indigo-500" :
                  s.name === "Reading" ? "from-emerald-500 to-teal-500" :
                  s.name === "Writing" ? "from-purple-500 to-pink-500" :
                  "from-amber-500 to-orange-500";
                
                return (
                  <div 
                    key={s.name} 
                    className={`rounded-2xl border border-border bg-card p-6 hover-lift hover-glow shadow-sm flex flex-col justify-between stagger-${idx + 1} animate-fade-in-up`}
                  >
                    <div>
                      <div className={`size-11 rounded-xl bg-gradient-to-tr ${gradient} text-white flex items-center justify-center mb-5 shadow-md shadow-accent/10`}>
                        <s.icon className="size-5.5" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 font-heading">{s.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* AI feature highlight */}
        <section className="max-w-4xl mx-auto px-6 py-24 flex flex-col items-center text-center">
          <div className="animate-fade-in-up w-full">
            <div className="text-xs font-extrabold uppercase tracking-widest text-accent mb-2.5 flex items-center justify-center gap-2">
              <Sparkles className="size-3.5 text-accent animate-pulse" />
              Instant Feedback Loop
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-heading mb-4 leading-tight">
              Real-time feedback that feels like a private examiner.
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-2xl mx-auto">
              Submit any IELTS, TOEFL, or TOEIC writing task and get instant grammar correction,
              vocabulary upgrades, coherence analysis, and an estimated band score with detailed reasoning.
            </p>
            <ul className="grid sm:grid-cols-2 gap-4 text-sm font-medium text-left max-w-2xl mx-auto">
              {[
                "Estimated band score with examiner reasoning",
                "Inline grammar fixes with explanations",
                "Smarter vocabulary and collocation suggestions",
                "Coherence & cohesion analysis",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 bg-card border border-border p-4 rounded-xl shadow-sm hover:shadow-md hover:border-accent/30 transition-all">
                  <div className="size-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="size-3 text-accent" />
                  </div>
                  <span className="text-foreground/95 leading-snug">{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Button size="lg" className="rounded-xl shadow-md" asChild>
                <Link to="/writing">
                  Try Writing Tutor <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats / progress strip */}
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-slate-100 border-y border-slate-800">
          <div className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-3 gap-10">
            {[
              { v: "4 Skill Areas", l: "Listening, Reading, Writing, and Speaking" },
              { v: "Daily Drills", l: "Vocabulary builders & custom mini-tests" },
              { v: "Real Mock Tests", l: "Timed full-length exam simulations" },
            ].map((s) => (
              <div key={s.v} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="text-4xl font-extrabold tracking-tight font-heading bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent">
                  {s.v}
                </div>
                <div className="text-xs opacity-75 mt-2 font-medium tracking-wide">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="size-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
              <Zap className="size-6 fill-current text-accent" />
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight font-heading max-w-2xl mx-auto">
              Your next score starts today.
            </h2>
            <p className="text-muted-foreground mt-4 text-sm max-w-md mx-auto leading-relaxed">
              Start for free today. Practice under exam constraints as much as you need to build confidence.
            </p>
            <div className="mt-8">
              <Button size="lg" className="rounded-xl bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20 hover:scale-105 transition-transform animate-pulse" asChild>
                <Link to={user ? "/dashboard" : "/auth"}>
                  {user ? "Go to Dashboard" : "Create Your Account Now"}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>© {new Date().getFullYear()} PassAssist</div>
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
