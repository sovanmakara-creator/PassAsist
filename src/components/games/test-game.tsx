import { useState, useMemo, useEffect } from "react";
import { WordData } from "@/integrations/supabase/types";
import { useSound } from "@/hooks/use-sound";
import {
  GameOverScreen,
  RoundIndicator,
  DifficultySelector,
  Difficulty,
  GameHint,
} from "./game-shared";
import { useGameState } from "@/hooks/use-game-state";

export function TestGame({
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

  const word = words[currentIndex];
  const { state, onCorrectAnswer, onWrongAnswer } = gameState;

  // Build options based on difficulty
  const options = useMemo(() => {
    if (!word) return [];

    // In Hard mode, use distractor definitions. In Easy mode, use definitions of other words.
    const opts = [word.definition];

    if (difficulty === "hard" && word.distractors?.length) {
      opts.push(...word.distractors.slice(0, 3));
    }

    // Fill remaining slots
    while (opts.length < 4) {
      const other = words[Math.floor(Math.random() * words.length)];
      if (other.id !== word.id && !opts.includes(other.definition)) {
        opts.push(other.definition);
      }
    }

    // Shuffle
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [word, words, difficulty]);

  const correctIndex = options.indexOf(word?.definition);

  const handleHint = () => {
    if (eliminated.length > 0 || selected !== null || difficulty === "hard") return;
    setSessionScore((s) => Math.max(0, s - 5));
    const wrong = options.map((_, i) => i).filter((i) => i !== correctIndex);
    const shuffled = wrong.sort(() => 0.5 - Math.random());
    setEliminated([shuffled[0], shuffled[1]]);
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);

    const isCorrect = idx === correctIndex;
    if (isCorrect) {
      sound.playCorrect();
      const diffMultiplier = difficulty === "easy" ? 1 : difficulty === "medium" ? 1.5 : 2;
      const pts = Math.floor(10 * diffMultiplier);
      setSessionScore((s) => s + pts);
      setSessionXP((x) => x + 10);
      onCorrectAnswer(word.id, 10);
    } else {
      sound.playWrong();
      onWrongAnswer(true); // Tests cost hearts on wrong answers
    }
    onResult(word.id, isCorrect);

    setTimeout(() => {
      if (!isCorrect) return; // Dead

      setSelected(null);
      setEliminated([]);
      if (currentIndex < words.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setRoundComplete(true);
        sound.playComplete();
        gameState.updateHighScore("test", sessionScore);
        gameState.recordGamePlayed();
      }
    }, 1500);
  };

  if (roundComplete) {
    return (
      <GameOverScreen
        title="Test Complete!"
        subtitle={`You finished the ${difficulty} test.`}
        score={sessionScore}
        xpEarned={sessionXP}
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

      <div className="w-full flex items-center justify-between mb-4">
        <GameHint
          onClick={handleHint}
          disabled={eliminated.length > 0 || selected !== null || difficulty === "hard"}
          label={eliminated.length > 0 ? "Hint Used" : "50/50 (-5 pts)"}
        />
        <div className="text-lg font-bold text-accent">{sessionScore} pts</div>
      </div>

      {/* Word to identify */}
      <div className="text-center py-6 w-full rounded-2xl border border-border/50 bg-card/50">
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
        {difficulty !== "hard" && word.part_of_speech && (
          <span className="text-xs text-muted-foreground/50 mt-2 inline-block px-2 py-1 border border-border rounded-md">
            {word.part_of_speech}
          </span>
        )}
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
