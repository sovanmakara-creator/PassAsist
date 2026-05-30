import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { WordData } from "@/integrations/supabase/types";
import { useSound } from "@/hooks/use-sound";
import {
  GameTimer,
  ComboIndicator,
  TimerBar,
  GameOverScreen,
  Confetti,
  RoundIndicator,
  DifficultySelector,
  Difficulty,
  GameHint,
} from "./game-shared";
import { useGameState } from "@/hooks/use-game-state";
import { Zap } from "lucide-react";

export function ClassicGame({
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
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [roundComplete, setRoundComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [eliminated, setEliminated] = useState<number[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const word = words[currentIndex];

  const maxTime = difficulty === "easy" ? 20 : difficulty === "medium" ? 12 : 6;
  const [timeLeft, setTimeLeft] = useState(maxTime);

  const { state, onCorrectAnswer, onWrongAnswer } = gameState;

  // Build options
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

  const handleHint = () => {
    if (eliminated.length > 0 || selected !== null || difficulty === "hard") return;
    setSessionScore((s) => Math.max(0, s - 5));
    const wrong = options.map((_, i) => i).filter((i) => i !== correctIndex);
    const shuffled = wrong.sort(() => 0.5 - Math.random());
    setEliminated([shuffled[0], shuffled[1]]);
  };

  // Timer
  useEffect(() => {
    if (roundComplete || selected !== null) return;
    setTimeLeft(maxTime);
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
  }, [currentIndex, roundComplete, maxTime, selected]);

  const handleAnswer = useCallback(
    (idx: number) => {
      if (selected !== null) return;
      if (timerRef.current) clearInterval(timerRef.current);
      setSelected(idx);

      const isCorrect = idx === correctIndex;
      if (isCorrect) {
        sound.playCorrect();

        // Calculate points based on speed & difficulty
        const speedBonus = Math.floor((timeLeft / maxTime) * 5);
        const diffMultiplier = difficulty === "easy" ? 1 : difficulty === "medium" ? 1.5 : 2;
        const pts = Math.floor((10 + speedBonus) * diffMultiplier);

        setSessionScore((s) => s + pts);
        setSessionXP((x) => x + 10);
        onCorrectAnswer(word.id, 10);
      } else {
        sound.playWrong();
        onWrongAnswer(true);
      }
      onResult(word.id, isCorrect);

      setTimeout(() => {
        setSelected(null);
        setEliminated([]);
        if (currentIndex < words.length - 1) {
          setCurrentIndex((i) => i + 1);
        } else {
          setRoundComplete(true);
          sound.playComplete();
          gameState.updateHighScore("classic", sessionScore);
          gameState.recordGamePlayed();
        }
      }, 1500);
    },
    [
      selected,
      correctIndex,
      currentIndex,
      words.length,
      word,
      sound,
      onResult,
      timeLeft,
      maxTime,
      difficulty,
      onCorrectAnswer,
      onWrongAnswer,
      gameState,
      sessionScore,
    ],
  );

  if (roundComplete) {
    return (
      <GameOverScreen
        title="Classic Mode Complete!"
        score={sessionScore}
        xpEarned={sessionXP}
        bestCombo={state.bestCombo}
        onPlayAgain={() => {
          setCurrentIndex(0);
          setSelected(null);
          setEliminated([]);
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
      <Confetti active={state.combo > 0 && state.combo % 5 === 0 && selected !== null} />

      {/* Header */}
      <div className="w-full flex items-center justify-between mb-2">
        <RoundIndicator
          current={currentIndex}
          total={words.length}
          accentColor={examColor.accent}
        />
        <DifficultySelector
          value={difficulty}
          onChange={(d) => {
            setDifficulty(d);
            setSelected(null);
            setCurrentIndex(0);
            gameState.resetCombo();
            setSessionScore(0);
          }}
          accentColor={examColor.accent}
        />
      </div>

      <div className="w-full flex items-center justify-between">
        <ComboIndicator combo={state.combo} />
        <div className="text-lg font-bold text-accent">{sessionScore} pts</div>
      </div>

      <div className="w-full flex flex-col items-center justify-center gap-1 mb-2">
        <GameHint
          onClick={handleHint}
          disabled={eliminated.length > 0 || selected !== null || difficulty === "hard"}
          label={eliminated.length > 0 ? "Hint Used" : "50/50 (-5 pts)"}
        />
      </div>

      <TimerBar timeLeft={timeLeft} maxTime={maxTime} accentColor={examColor.accent} />

      {/* Word to identify */}
      <div className="text-center py-6">
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
        {word.phonetic && <p className="text-sm text-muted-foreground">{word.phonetic}</p>}
        <p className="text-xs text-muted-foreground/60 mt-2">
          Rush mode: Pick the definition quickly!
        </p>
      </div>

      {/* Options */}
      <div className="w-full grid gap-3">
        {options.map((opt, idx) => {
          const isCorrectOption = idx === correctIndex;
          const isSelected = idx === selected;
          const isEliminated = eliminated.includes(idx);
          let style = isEliminated
            ? "opacity-20 cursor-not-allowed border-dashed"
            : "hover:bg-accent/5 hover:border-accent/30";

          if (selected !== null && !isEliminated) {
            if (isCorrectOption) style = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
            else if (isSelected) style = "border-red-500 bg-red-500/10 text-red-400 animate-shake";
            else style = "opacity-40";
          }
          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selected !== null || isEliminated}
              className={`w-full text-left p-4 rounded-xl border border-border bg-card transition-all duration-200 text-sm ${style}`}
            >
              <span className="font-medium text-muted-foreground/60 mr-3">
                {String.fromCharCode(65 + idx)}.
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
