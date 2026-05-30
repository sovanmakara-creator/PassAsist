import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { WordData } from "@/integrations/supabase/types";
import { useSound } from "@/hooks/use-sound";
import { GameOverScreen, Confetti, RoundIndicator } from "./game-shared";
import { useGameState } from "@/hooks/use-game-state";

export function PhraseQuizGame({
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

  const word = words[currentIndex];

  const { state, onCorrectAnswer, onWrongAnswer } = gameState;

  // Build options
  const options = useMemo(() => {
    if (!word) return [];
    // The phrases are generated with 3 distractors, but we should make sure we fall back if missing
    const opts = [word.definition, ...(word.distractors?.slice(0, 3) || [])];
    while (opts.length < 4) {
      const other = words[Math.floor(Math.random() * words.length)];
      if (other.id !== word.id && !opts.includes(other.definition)) {
        opts.push(other.definition);
      }
    }
    // Shuffle options
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [word, words]);

  const correctIndex = options.indexOf(word?.definition);

  const handleAnswer = useCallback(
    (idx: number) => {
      if (selected !== null) return;
      setSelected(idx);

      const isCorrect = idx === correctIndex;
      if (isCorrect) {
        sound.playCorrect();

        const pts = 15; // fixed points for phrase game
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
        if (currentIndex < words.length - 1) {
          setCurrentIndex((i) => i + 1);
        } else {
          setRoundComplete(true);
          sound.playComplete();
          gameState.updateHighScore("phrases", sessionScore);
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
      onCorrectAnswer,
      onWrongAnswer,
      gameState,
      sessionScore,
    ],
  );

  if (roundComplete) {
    return (
      <GameOverScreen
        title="Phrase Quiz Complete!"
        score={sessionScore}
        xpEarned={sessionXP}
        bestCombo={state.bestCombo}
        onPlayAgain={() => {
          setCurrentIndex(0);
          setSelected(null);
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
      <Confetti active={state.combo > 0 && state.combo % 3 === 0 && selected !== null} />

      {/* Header */}
      <div className="w-full flex items-center justify-between mb-2">
        <RoundIndicator
          current={currentIndex}
          total={words.length}
          accentColor={examColor.accent}
        />
        <div className="text-lg font-bold text-accent">{sessionScore} pts</div>
      </div>

      {/* Phrase to identify */}
      <div className="text-center py-8">
        <div className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          What does this phrase mean?
        </div>
        <div
          className="text-3xl font-bold tracking-tight mb-2 leading-tight"
          style={{
            background: `linear-gradient(135deg, ${examColor.from}, ${examColor.to})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          "{word.word}"
        </div>
      </div>

      {/* Options */}
      <div className="w-full grid gap-3">
        {options.map((opt, idx) => {
          const isCorrectOption = idx === correctIndex;
          const isSelected = idx === selected;
          let style = "hover:bg-accent/5 hover:border-accent/30";

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
              className={`w-full text-left p-5 rounded-xl border border-border bg-card transition-all duration-200 text-sm ${style}`}
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
