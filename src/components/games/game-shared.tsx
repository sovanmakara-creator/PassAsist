import { Flame, Star, Zap, Trophy, Timer, Shield, Lightbulb } from "lucide-react";

// ──────────────────────────────────────────────────
// Shared game UI components used across all game modes
// ──────────────────────────────────────────────────

// ── Score Display ───────────────────────────────

export function ScoreDisplay({ score, label = "Score" }: { score: number; label?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Star className="size-4 text-yellow-500 fill-yellow-500" />
      <span className="text-sm font-bold tabular-nums">{score.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Combo Indicator ─────────────────────────────

export function ComboIndicator({ combo }: { combo: number }) {
  if (combo < 2) return null;
  const multiplier = Math.min(4, 1 + Math.floor(combo / 5));
  return (
    <div
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold animate-bounce"
      style={{
        background:
          combo >= 15
            ? "linear-gradient(135deg, #f97316, #ef4444)"
            : combo >= 10
              ? "linear-gradient(135deg, #eab308, #f97316)"
              : combo >= 5
                ? "linear-gradient(135deg, #14b8a6, #3b82f6)"
                : "var(--accent)",
        color: "white",
      }}
    >
      <Zap className="size-3" />
      {combo}x{multiplier > 1 && <span className="ml-0.5">×{multiplier}</span>}
    </div>
  );
}

// ── XP Progress Bar ─────────────────────────────

export function XPBar({
  level,
  current,
  needed,
  percent,
  accentColor,
}: {
  level: number;
  current: number;
  needed: number;
  percent: number;
  accentColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex items-center gap-1.5 shrink-0">
        <Shield className="size-4 text-accent" />
        <span className="text-sm font-bold">Lv.{level}</span>
      </div>
      <div className="flex-1 h-2 rounded-full bg-border/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percent}%`,
            background: accentColor || "var(--accent)",
          }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
        {current}/{needed} XP
      </span>
    </div>
  );
}

// ── Game Timer ──────────────────────────────────

export function GameTimer({
  timeLeft,
  maxTime,
  accentColor,
  danger = false,
}: {
  timeLeft: number;
  maxTime: number;
  accentColor?: string;
  danger?: boolean;
}) {
  return (
    <div className="relative size-16">
      <svg className="size-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke={danger ? "#ef4444" : accentColor || "var(--accent)"}
          strokeWidth="4"
          strokeDasharray={`${(timeLeft / maxTime) * 175.9} 175.9`}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums ${danger ? "text-red-500" : ""}`}
      >
        {timeLeft}
      </span>
    </div>
  );
}

// ── Linear Timer Bar ────────────────────────────

export function TimerBar({
  timeLeft,
  maxTime,
  accentColor,
}: {
  timeLeft: number;
  maxTime: number;
  accentColor?: string;
}) {
  const percent = (timeLeft / maxTime) * 100;
  const danger = percent < 25;
  return (
    <div className="w-full h-2 rounded-full bg-border/50 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-linear"
        style={{
          width: `${percent}%`,
          background: danger ? "#ef4444" : accentColor || "var(--accent)",
        }}
      />
    </div>
  );
}

// ── Difficulty Selector ─────────────────────────

export type Difficulty = "easy" | "medium" | "hard";

export function DifficultySelector({
  value,
  onChange,
  accentColor,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  accentColor?: string;
}) {
  const diffs: { id: Difficulty; label: string; emoji: string }[] = [
    { id: "easy", label: "Easy", emoji: "🟢" },
    { id: "medium", label: "Medium", emoji: "🟡" },
    { id: "hard", label: "Hard", emoji: "🔴" },
  ];
  return (
    <div className="flex gap-2">
      {diffs.map((d) => (
        <button
          key={d.id}
          onClick={() => onChange(d.id)}
          className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 ${
            value === d.id
              ? "text-white shadow-lg border-transparent"
              : "border-border text-muted-foreground hover:border-accent/30"
          }`}
          style={value === d.id ? { background: accentColor || "var(--accent)" } : undefined}
        >
          {d.emoji} {d.label}
        </button>
      ))}
    </div>
  );
}

// ── Round/Progress Indicator ────────────────────

export function RoundIndicator({
  current,
  total,
  accentColor,
}: {
  current: number;
  total: number;
  accentColor?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === current ? "24px" : "8px",
              backgroundColor:
                i < current
                  ? "#10b981"
                  : i === current
                    ? accentColor || "var(--accent)"
                    : "var(--border)",
            }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {current + 1}/{total}
      </span>
    </div>
  );
}

// ── Game Over Screen ────────────────────────────

export function GameOverScreen({
  title,
  subtitle,
  score,
  xpEarned,
  wordsLearned,
  bestCombo,
  onPlayAgain,
  onBackToMenu,
  accentColor,
}: {
  title: string;
  subtitle?: string;
  score: number;
  xpEarned?: number;
  wordsLearned?: number;
  bestCombo?: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  accentColor?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-6xl mb-4">{score >= 80 ? "🏆" : score >= 50 ? "⭐" : "📚"}</div>
      <h3 className="text-2xl font-bold mb-1">{title}</h3>
      {subtitle && <p className="text-muted-foreground mb-6">{subtitle}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <Star className="size-4 mx-auto mb-1 text-yellow-500 fill-yellow-500" />
          <div className="text-lg font-bold tabular-nums">{score}</div>
          <div className="text-xs text-muted-foreground">Score</div>
        </div>
        {xpEarned != null && (
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <Zap className="size-4 mx-auto mb-1 text-accent" />
            <div className="text-lg font-bold tabular-nums">+{xpEarned}</div>
            <div className="text-xs text-muted-foreground">XP</div>
          </div>
        )}
        {wordsLearned != null && (
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <Trophy className="size-4 mx-auto mb-1 text-emerald-500" />
            <div className="text-lg font-bold tabular-nums">{wordsLearned}</div>
            <div className="text-xs text-muted-foreground">Words</div>
          </div>
        )}
        {bestCombo != null && bestCombo > 1 && (
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <Flame className="size-4 mx-auto mb-1 text-orange-500" />
            <div className="text-lg font-bold tabular-nums">{bestCombo}x</div>
            <div className="text-xs text-muted-foreground">Best Combo</div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBackToMenu}
          className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/50 transition-colors"
        >
          Back to Menu
        </button>
        <button
          onClick={onPlayAgain}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: accentColor || "var(--accent)" }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

// ── Confetti Effect ─────────────────────────────

export function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="confetti-particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1 + Math.random() * 1.5}s`,
            backgroundColor: ["#8b5cf6", "#3b82f6", "#14b8a6", "#f97316", "#eab308", "#ec4899"][
              i % 6
            ],
          }}
        />
      ))}
    </div>
  );
}

// ── CSS Animations (inject once) ────────────────

export const gameAnimationStyles = `
  @keyframes confetti-fall {
    0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
  .confetti-particle {
    position: absolute;
    top: -10px;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    animation: confetti-fall ease-out forwards;
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
  }
  .animate-shake { animation: shake 0.5s ease-in-out; }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0.4); }
    50% { box-shadow: 0 0 20px 4px rgba(var(--accent-rgb), 0.2); }
  }
  .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
  .perspective-1000 { perspective: 1000px; }
  @keyframes slide-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-slide-up { animation: slide-up 0.3s ease-out; }
  @keyframes pop {
    0% { transform: scale(0.8); opacity: 0; }
    60% { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }
  .animate-pop { animation: pop 0.35s ease-out; }
`;

// -- Game Hint Button ----------------------------

export function GameHint({
  onClick,
  disabled = false,
  label = "Get a hint (-5 pts)",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  if (disabled) return null;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-400 transition-colors animate-fade-in"
    >
      <Lightbulb className="size-3.5" />
      {label}
    </button>
  );
}
