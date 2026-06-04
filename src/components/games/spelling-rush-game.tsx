import { useState, useMemo, useEffect } from "react";
import { WordData } from "@/integrations/supabase/types";
import { useSound } from "@/hooks/use-sound";
import { GameOverScreen, Confetti, RoundIndicator, GameTimer, GameHint } from "./game-shared";
import { useGameState } from "@/hooks/use-game-state";
import { ArrowRight, Play, Zap } from "lucide-react";

type Phase = "hunt" | "summary" | "rush" | "gameover";

export function SpellingRushGame({
  words,
  onResult,
  sound,
  examColor,
  gameState,
  onBack,
}: {
  words: WordData[];
  onResult: (wordId: string, correct: boolean) => void;
  sound: ReturnType<typeof useSound>;
  examColor: { from: string; to: string; accent: string };
  gameState: ReturnType<typeof useGameState>;
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("hunt");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);

  // --- Phase 1: Letter Hunt State ---
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [roundRevealed, setRoundRevealed] = useState(false);
  const [roundCorrect, setRoundCorrect] = useState(false);

  // --- Phase 3: Rush Mode State ---
  const [rushIndex, setRushIndex] = useState(0);
  const [rushTimeLeft, setRushTimeLeft] = useState(10);
  const [rushRevealed, setRushRevealed] = useState(false);
  const [rushCorrect, setRushCorrect] = useState(false);
  const [rushSelected, setRushSelected] = useState<string | null>(null);
  const [rushEliminated, setRushEliminated] = useState<string[]>([]);

  const { state, onCorrectAnswer, onWrongAnswer } = gameState;
  const word = words[currentIndex];
  const rushWord = words[rushIndex];

  // --- Helpers for Phase 1 ---
  const { blanks, missingLetters, letterGrid } = useMemo(() => {
    if (!word) return { blanks: [], missingLetters: [], letterGrid: [] };
    const letters = word.word.toUpperCase().split("");
    const blanksConfig = letters.map((l, i) => {
      // Always show first and last letter, blank some in between
      if (i === 0 || i === letters.length - 1) return { char: l, isBlank: false };
      // 50% chance to blank a middle letter
      if (Math.random() > 0.5) return { char: l, isBlank: true };
      return { char: l, isBlank: false };
    });

    // Ensure at least 2 blanks
    const actualBlanks = blanksConfig.filter((b) => b.isBlank);
    if (actualBlanks.length < 2 && letters.length > 3) {
      blanksConfig[1].isBlank = true;
      blanksConfig[letters.length - 2].isBlank = true;
    }

    const missing = blanksConfig.filter((b) => b.isBlank).map((b) => b.char);

    // Generate grid: missing letters + random distractors
    const grid = [...missing];
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    while (grid.length < Math.max(6, missing.length + 3)) {
      grid.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
    }
    // Shuffle grid
    for (let i = grid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [grid[i], grid[j]] = [grid[j], grid[i]];
    }

    return { blanks: blanksConfig, missingLetters: missing, letterGrid: grid };
  }, [word]);

  const handleLetterTap = (letter: string) => {
    if (roundRevealed) return;
    setGuessedLetters((prev) => {
      const next = [...prev, letter];
      if (next.length === missingLetters.length) {
        // Auto check
        const isWin = next.join("") === missingLetters.join("");
        setRoundRevealed(true);
        setRoundCorrect(isWin);
        if (isWin) {
          sound.playCorrect();
          setSessionScore((s) => s + 20);
          setSessionXP((x) => x + 10);
        } else {
          sound.playWrong();
          onWrongAnswer(true);
        }
      } else {
        sound.playTick();
      }
      return next;
    });
  };

  const handleBackspace = () => {
    if (roundRevealed) return;
    sound.playTick();
    setGuessedLetters((prev) => prev.slice(0, -1));
  };

  const handleNextPhase1 = () => {
    setGuessedLetters([]);
    setRoundRevealed(false);
    if (currentIndex < words.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setPhase("summary");
      sound.playComplete();
    }
  };

  // --- Helpers for Phase 3 ---
  const rushOptions = useMemo(() => {
    if (!rushWord) return [];
    const w = rushWord.word.toUpperCase();
    const opts = [w];

    const shuffleWord = (word: string) => {
      const arr = word.split("");
      // Swap two adjacent internal letters
      if (arr.length > 3) {
        const idx = 1 + Math.floor(Math.random() * (arr.length - 3));
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      } else {
        [arr[0], arr[1]] = [arr[1], arr[0]];
      }
      return arr.join("");
    };

    while (opts.length < 4) {
      let fake = shuffleWord(w);
      if (Math.random() > 0.5) fake = fake.replace("E", "A").replace("I", "E").replace("C", "S");
      if (!opts.includes(fake)) opts.push(fake);
    }

    // Shuffle options
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [rushWord]);

  useEffect(() => {
    if (phase !== "rush" || rushRevealed) return;
    setRushTimeLeft(10);
    const timer = setInterval(() => {
      setRushTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleRushAnswer(""); // Timeout = wrong
          return 0;
        }
        if (t <= 3) sound.playTick();
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rushIndex, phase, rushRevealed]);

  const handleRushHint = () => {
    if (rushEliminated.length > 0 || rushSelected !== null || rushRevealed) return;
    setSessionScore((s) => Math.max(0, s - 5));
    const wrong = rushOptions.filter((o) => o !== rushWord.word.toUpperCase());
    const shuffled = wrong.sort(() => 0.5 - Math.random());
    setRushEliminated([shuffled[0], shuffled[1]]);
  };

  const handleRushAnswer = (opt: string) => {
    if (rushRevealed) return;
    setRushSelected(opt);
    setRushRevealed(true);
    const isWin = opt === rushWord.word.toUpperCase();
    setRushCorrect(isWin);

    if (isWin) {
      sound.playCorrect();
      setSessionScore((s) => s + 30);
      setSessionXP((x) => x + 15);
      onCorrectAnswer(rushWord.id, 25);
    } else {
      sound.playWrong();
      onWrongAnswer(true);
    }
    onResult(rushWord.id, isWin);

    setTimeout(() => {
      setRushRevealed(false);
      setRushSelected(null);
      setRushEliminated([]);
      if (rushIndex < words.length - 1) {
        setRushIndex((i) => i + 1);
      } else {
        setPhase("gameover");
        sound.playComplete();
        gameState.updateHighScore("spelling_rush", sessionScore);
        gameState.recordGamePlayed();
      }
    }, 1500);
  };

  if (phase === "gameover") {
    return (
      <GameOverScreen
        title="Rush Complete! 🚀"
        score={sessionScore}
        xpEarned={sessionXP}
        bestCombo={state.bestCombo}
        onPlayAgain={() => {
          setPhase("hunt");
          setCurrentIndex(0);
          setRushIndex(0);
          setRushEliminated([]);
          setSessionScore(0);
          setSessionXP(0);
          gameState.resetCombo();
        }}
        onBackToMenu={onBack}
        accentColor={examColor.accent}
      />
    );
  }

  // ---------------------------------------------------------
  // PHASE 1: LETTER HUNT
  // ---------------------------------------------------------
  if (phase === "hunt") {
    if (!word) return null;
    let guessPointer = 0;

    return (
      <div className="flex flex-col items-center gap-6 max-w-lg mx-auto w-full animate-slide-up">
        <Confetti active={roundRevealed && roundCorrect} />

        <div className="w-full flex items-center justify-between mb-4">
          <RoundIndicator
            current={currentIndex}
            total={words.length}
            accentColor={examColor.accent}
          />
          <div className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase flex items-center gap-1">
            <Zap className="size-3" /> Phase 1: Letter Hunt
          </div>
        </div>

        <div className="w-full rounded-2xl bg-card border border-border p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-purple-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow">
            {word.cefr_level}
          </div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-2 font-semibold">
            Definition
          </p>
          <p className="text-lg font-semibold mb-8">
            ({word.part_of_speech}) {word.definition}
          </p>

          {/* Word Blanks */}
          <div className="flex justify-center gap-2 mb-4 flex-wrap">
            {blanks.map((b, i) => {
              if (b.isBlank) {
                const isFilled = guessPointer < guessedLetters.length;
                const char = isFilled ? guessedLetters[guessPointer] : "";
                guessPointer++;
                let colorClass = "border-border text-foreground";
                if (roundRevealed) {
                  colorClass = roundCorrect
                    ? "border-emerald-500 text-emerald-500"
                    : "border-red-500 text-red-500";
                } else if (isFilled) {
                  colorClass = "border-accent text-accent";
                }
                return (
                  <div
                    key={i}
                    className={`size-10 sm:size-12 rounded-lg border-2 flex items-center justify-center text-xl font-bold transition-all ${colorClass}`}
                  >
                    {char}
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  className="size-10 sm:size-12 flex items-center justify-center text-xl font-bold text-muted-foreground"
                >
                  {b.char}
                </div>
              );
            })}
          </div>
        </div>

        {/* Letter Grid */}
        <div className="w-full grid grid-cols-4 sm:grid-cols-5 gap-2">
          {letterGrid.map((letter, i) => (
            <button
              key={i}
              onClick={() => handleLetterTap(letter)}
              disabled={roundRevealed || guessedLetters.length >= missingLetters.length}
              className="h-12 rounded-xl bg-card border border-border hover:border-accent hover:text-accent font-bold text-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {letter}
            </button>
          ))}
        </div>

        <div className="w-full flex gap-3 mt-2">
          <button
            onClick={handleBackspace}
            disabled={roundRevealed || guessedLetters.length === 0}
            className="flex-1 h-12 rounded-xl bg-card border border-border hover:bg-muted font-bold flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
          >
            ⌫
          </button>
          {roundRevealed && (
            <button
              onClick={handleNextPhase1}
              className="flex-[2] h-12 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 animate-pop"
              style={{ background: examColor.accent }}
            >
              Next <ArrowRight className="size-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // PHASE 2: SUMMARY
  // ---------------------------------------------------------
  if (phase === "summary") {
    return (
      <div className="flex flex-col items-center gap-6 max-w-lg mx-auto w-full animate-slide-up">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-accent">
          <Zap /> Phase 1 Complete!
        </h2>
        <p className="text-muted-foreground">Review your words before the final Rush Mode.</p>

        <div className="w-full flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 pb-4">
          {words.map((w, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">{w.word}</span>
                <span className="bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded text-xs font-bold">
                  {w.cefr_level}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{w.definition}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setPhase("rush");
            sound.playCorrect();
          }}
          className="w-full h-14 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          style={{ background: `linear-gradient(135deg, ${examColor.from}, ${examColor.to})` }}
        >
          <Play className="size-5 fill-white" /> Start Fake Word Rush!
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------
  // PHASE 3: FAKE WORD RUSH
  // ---------------------------------------------------------
  if (phase === "rush") {
    if (!rushWord) return null;
    return (
      <div className="flex flex-col items-center gap-6 max-w-lg mx-auto w-full animate-slide-up">
        <div className="w-full flex items-center justify-between mb-2">
          <RoundIndicator current={rushIndex} total={words.length} accentColor={examColor.accent} />
          <div className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-bold uppercase flex items-center gap-1">
            <Flame className="size-3" /> Phase 3: Rush
          </div>
        </div>

        <div className="w-full flex items-center justify-between mb-2">
          <GameHint
            onClick={handleRushHint}
            disabled={rushEliminated.length > 0 || rushSelected !== null || rushRevealed}
            label={rushEliminated.length > 0 ? "Hint Used" : "50/50 (-5 pts)"}
          />
          <div className="text-xl font-bold text-accent drop-shadow-sm">{sessionScore} pts ✨</div>
        </div>

        <GameTimer
          timeLeft={rushTimeLeft}
          maxTime={10}
          accentColor={examColor.accent}
          danger={rushTimeLeft <= 3}
        />

        <div className="text-center py-6">
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-2">
            Find the correct spelling
          </p>
          <p className="text-lg font-bold">
            ({rushWord.part_of_speech}) {rushWord.definition}
          </p>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rushOptions.map((opt, i) => {
            const isCorrectOption = opt === rushWord.word.toUpperCase();
            const isSelected = opt === rushSelected;
            const isEliminated = rushEliminated.includes(opt);
            let style = isEliminated
              ? "opacity-20 cursor-not-allowed border-dashed"
              : "border-border bg-card hover:border-accent/50 hover:bg-accent/5";

            if (rushRevealed && !isEliminated) {
              if (isCorrectOption)
                style =
                  "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
              else if (isSelected)
                style = "border-red-500 bg-red-500/10 text-red-500 animate-shake";
              else style = "opacity-40";
            }

            return (
              <button
                key={i}
                onClick={() => handleRushAnswer(opt)}
                disabled={rushRevealed || isEliminated}
                className={`h-16 rounded-xl border-2 text-lg font-bold tracking-wider transition-all duration-200 ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

// Temporary Flame icon since it might not be imported in game-shared everywhere
function Flame(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
