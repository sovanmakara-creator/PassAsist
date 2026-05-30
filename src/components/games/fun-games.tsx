import { useState, useMemo, useEffect, useRef } from "react";
import { WordData } from "@/integrations/supabase/types";
import { useSound } from "@/hooks/use-sound";
import { GameTimer, ComboIndicator, GameOverScreen, Confetti, GameHint } from "./game-shared";
import { useGameState } from "@/hooks/use-game-state";

// ── Survival Game (Endless Quiz, time gets shorter) ────────

export function SurvivalGame({
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [roundComplete, setRoundComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  // Time decreases as you progress
  const maxTime = Math.max(3, 10 - Math.floor(currentIndex / 5));
  const [timeLeft, setTimeLeft] = useState(maxTime);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const word = words[currentIndex % words.length]; // Wrap around if they survive long enough!
  const { state, onCorrectAnswer, onWrongAnswer } = gameState;

  const options = useMemo(() => {
    if (!word) return [];
    const opts = [word.definition, ...(word.distractors?.slice(0, 3) || [])];
    while (opts.length < 4) {
      const other = words[Math.floor(Math.random() * words.length)];
      if (other.id !== word.id && !opts.includes(other.definition)) {
        opts.push(other.definition);
      }
    }
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [word, words]);

  const correctIndex = options.indexOf(word?.definition);

  useEffect(() => {
    setTimeLeft(maxTime);
  }, [currentIndex, maxTime]);

  useEffect(() => {
    if (roundComplete || selected !== null || frozen) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleAnswer(-1); // Time up -> wrong
          return 0;
        }
        if (t <= 3) sound.playTick();
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roundComplete, selected, frozen]);

  const handleHint = () => {
    if (hintUsed || frozen || selected !== null) return;
    setHintUsed(true);
    setFrozen(true);
    setSessionScore((s) => Math.max(0, s - 5));
    // Freeze for 5 seconds
    setTimeout(() => {
      setFrozen(false);
    }, 5000);
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(idx);

    const isCorrect = idx === correctIndex;
    if (isCorrect) {
      sound.playCorrect();
      const pts = 15 + Math.floor(currentIndex / 2); // Score scales with survival
      setSessionScore((s) => s + pts);
      setSessionXP((x) => x + 15);
      onCorrectAnswer(word.id, 15);
    } else {
      sound.playWrong();
      onWrongAnswer(true);
    }
    onResult(word.id, isCorrect);

    setTimeout(() => {
      setSelected(null);
      setHintUsed(false);
      setFrozen(false);
      setCurrentIndex((i) => i + 1); // Keep going!
    }, 1000);
  };

  if (roundComplete) {
    return (
      <GameOverScreen
        title="Survival Over!"
        subtitle={`You survived ${currentIndex} rounds.`}
        score={sessionScore}
        xpEarned={sessionXP}
        bestCombo={state.bestCombo}
        onPlayAgain={() => {
          setCurrentIndex(0);
          setSelected(null);
          setHintUsed(false);
          setFrozen(false);
          setRoundComplete(false);
          setSessionScore(0);
          setSessionXP(0);
          gameState.resetCombo();
        }}
        onBackToMenu={onBack}
        accentColor={examColor.accent}
      />
    );
  }

  if (!word) return null;

  return (
    <div className="flex flex-col items-center gap-6 max-w-lg mx-auto w-full animate-slide-up">
      <Confetti active={state.combo > 0 && state.combo % 10 === 0 && selected !== null} />

      <div className="w-full flex items-center justify-between mb-2">
        <div className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-bold uppercase tracking-widest border border-red-500/20">
          Survival Mode
        </div>
        <div className="text-sm font-semibold text-muted-foreground">Round {currentIndex + 1}</div>
      </div>

      <div className="w-full flex items-center justify-between mb-4">
        <GameHint
          onClick={handleHint}
          disabled={hintUsed || frozen || selected !== null}
          label={hintUsed ? "Hint Used" : frozen ? "Timer Frozen!" : "Freeze Time (-5 pts)"}
        />
        <div className="text-xl font-bold text-accent drop-shadow-sm">{sessionScore} pts ✨</div>
      </div>

      <GameTimer
        timeLeft={timeLeft}
        maxTime={maxTime}
        accentColor={frozen ? "#3b82f6" : examColor.accent}
        danger={timeLeft <= 3 && !frozen}
      />

      <div className="text-center py-4">
        <div
          className="text-4xl font-bold tracking-tight mb-2"
          style={{
            background: `linear-gradient(135deg, ${examColor.from}, ${examColor.to})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {word.word}
        </div>
      </div>

      <div className="w-full grid gap-3">
        {options.map((opt, idx) => {
          const isCorrectOption = idx === correctIndex;
          const isSelected = idx === selected;
          let style = "";
          if (selected !== null) {
            if (isCorrectOption) style = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
            else if (isSelected) style = "border-red-500 bg-red-500/10 text-red-400 animate-shake";
            else style = "opacity-40";
          }
          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selected !== null}
              className={`w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-accent/5 transition-all duration-200 text-sm ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Word Scramble Game (Unscramble letters) ────────────────

export function ScrambleGame({
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [revealedLetters, setRevealedLetters] = useState(0);

  const word = words[currentIndex];
  const { state, onCorrectAnswer, onWrongAnswer } = gameState;

  const scrambled = useMemo(() => {
    if (!word) return "";
    const letters = word.word.split("");
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    // Prevent it from accidentally spelling the correct word
    if (letters.join("") === word.word) {
      const temp = letters[0];
      letters[0] = letters[letters.length - 1];
      letters[letters.length - 1] = temp;
    }
    return letters.join("").toUpperCase();
  }, [word]);

  const handleHint = () => {
    if (revealed || revealedLetters >= word.word.length - 1) return;
    setSessionScore((s) => Math.max(0, s - 5));
    setRevealedLetters((r) => r + 1);
  };

  const handleSubmit = () => {
    if (!input.trim() || revealed) return;
    const correct = input.trim().toLowerCase() === word.word.toLowerCase();
    setIsCorrect(correct);
    setRevealed(true);

    if (correct) {
      sound.playCorrect();
      setSessionScore((s) => s + 15);
      onCorrectAnswer(word.id, 15);
    } else {
      sound.playWrong();
      onWrongAnswer(true);
    }
    onResult(word.id, correct);
  };

  const handleNext = () => {
    if (!isCorrect) return;
    setInput("");
    setRevealed(false);
    setRevealedLetters(0);
    if (currentIndex < words.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setRoundComplete(true);
      sound.playComplete();
      gameState.updateHighScore("scramble", sessionScore);
      gameState.recordGamePlayed();
    }
  };

  if (roundComplete) {
    return (
      <GameOverScreen
        title="Scramble Complete!"
        score={sessionScore}
        bestCombo={state.bestCombo}
        onPlayAgain={() => {
          setCurrentIndex(0);
          setInput("");
          setRevealed(false);
          setRevealedLetters(0);
          setRoundComplete(false);
          setSessionScore(0);
          gameState.resetCombo();
        }}
        onBackToMenu={onBack}
        accentColor={examColor.accent}
      />
    );
  }

  if (!word) return null;

  return (
    <div className="flex flex-col items-center gap-6 max-w-lg mx-auto w-full animate-slide-up">
      <div className="w-full flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-muted-foreground">
          {currentIndex + 1} / {words.length}
        </span>
        <div className="text-lg font-bold text-accent">{sessionScore} pts</div>
      </div>

      <div className="text-center w-full">
        <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-2">
          Definition
        </p>
        <p className="text-lg font-semibold">{word.definition}</p>
      </div>

      <div className="w-full flex justify-center gap-2 my-8 flex-wrap">
        {scrambled.split("").map((letter, i) => (
          <div
            key={i}
            className="size-12 md:size-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold bg-card shadow-sm"
            style={{ borderColor: examColor.accent, color: examColor.accent }}
          >
            {letter}
          </div>
        ))}
      </div>

      {revealedLetters > 0 && (
        <div className="text-sm font-bold text-orange-500 tracking-[0.3em] uppercase animate-pulse">
          Hint: {word.word.substring(0, revealedLetters)}
          {"_ ".repeat(word.word.length - revealedLetters)}
        </div>
      )}

      <div className="w-full flex gap-3 mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (revealed) handleNext();
              else handleSubmit();
            }
          }}
          disabled={revealed}
          placeholder="Unscramble it..."
          className={`flex-1 h-12 px-4 rounded-xl border bg-card text-center text-lg font-bold tracking-widest outline-none transition-colors ${
            revealed
              ? isCorrect
                ? "border-emerald-500 bg-emerald-500/5 text-emerald-500"
                : "border-red-500 bg-red-500/5 text-red-500"
              : "border-border focus:border-accent"
          }`}
        />
      </div>

      <div className="w-full flex items-center justify-between gap-4 mt-2">
        {!revealed && (
          <GameHint
            onClick={handleHint}
            disabled={revealedLetters >= word.word.length - 1}
            label={revealedLetters > 0 ? "Reveal Next (-5 pts)" : "Reveal Letter (-5 pts)"}
          />
        )}
        <div className="flex-1">
          {!revealed ? (
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="w-full h-12 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: examColor.accent }}
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full h-12 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted/50 transition-colors"
            >
              Next Word
            </button>
          )}
        </div>
      </div>

      {revealed && !isCorrect && (
        <div className="w-full p-4 rounded-xl bg-red-500/10 text-red-400 text-center animate-shake mt-2">
          Correct answer:{" "}
          <strong className="text-emerald-400 tracking-wider">{word.word.toUpperCase()}</strong>
        </div>
      )}
    </div>
  );
}
