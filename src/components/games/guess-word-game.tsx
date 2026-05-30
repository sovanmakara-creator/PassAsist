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
import { ArrowRight } from "lucide-react";

export function GuessWordGame({
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
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const word = words[currentIndex];
  const { state, onCorrectAnswer, onWrongAnswer } = gameState;

  useEffect(() => {
    if (!revealed && inputRef.current) inputRef.current.focus();
  }, [currentIndex, revealed]);

  const blankedSentence = useMemo(() => {
    if (!word?.example_sentence) return "Use this word in a sentence.";
    const regex = new RegExp(`\\b${word.word}\\b`, "gi");
    return word.example_sentence.replace(regex, "______");
  }, [word]);

  const hintText = useMemo(() => {
    if (!word) return "";
    if (hintsUsed === 0) return `${word.word.length} letters`;
    if (hintsUsed === 1)
      return `Starts with '${word.word[0].toUpperCase()}' (${word.word.length} letters)`;
    return `Starts with '${word.word.substring(0, 2).toUpperCase()}' (${word.word.length} letters)`;
  }, [word, hintsUsed]);

  const handleSubmit = () => {
    if (!input.trim() || revealed) return;
    const correct = input.trim().toLowerCase() === word.word.toLowerCase();
    setIsCorrect(correct);
    setRevealed(true);

    if (correct) {
      sound.playCorrect();
      const pts = Math.max(5, 20 - hintsUsed * 5); // Fewer hints = more points
      setSessionScore((s) => s + pts);
      setSessionXP((x) => x + 15);
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
    setHintsUsed(0);
    if (currentIndex < words.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setRoundComplete(true);
      sound.playComplete();
      gameState.updateHighScore("guess", sessionScore);
      gameState.recordGamePlayed();
    }
  };

  if (roundComplete) {
    return (
      <GameOverScreen
        title="Guess the Word Complete!"
        score={sessionScore}
        xpEarned={sessionXP}
        bestCombo={state.bestCombo}
        onPlayAgain={() => {
          setCurrentIndex(0);
          setInput("");
          setRevealed(false);
          setRoundComplete(false);
          setSessionScore(0);
          setSessionXP(0);
          setHintsUsed(0);
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
      <Confetti active={state.combo > 0 && state.combo % 3 === 0 && revealed && isCorrect} />

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
            setInput("");
            setRevealed(false);
            setHintsUsed(0);
            setCurrentIndex(0);
            gameState.resetCombo();
            setSessionScore(0);
          }}
          accentColor={examColor.accent}
        />
      </div>

      <div className="w-full flex items-center justify-between mb-4">
        <ComboIndicator combo={state.combo} />
        <div className="text-lg font-bold text-accent">{sessionScore} pts</div>
      </div>

      {/* Definition hint */}
      <div
        className="w-full rounded-xl border border-border/50 p-6 text-center"
        style={{
          background: `linear-gradient(135deg, var(--card) 0%, var(--surface) 100%)`,
          boxShadow: `0 0 30px ${examColor.from}10`,
          borderColor: `${examColor.from}25`,
        }}
      >
        <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-2">
          Definition
        </p>
        <p className="text-lg font-semibold">{word.definition}</p>
        {word.part_of_speech && difficulty !== "hard" && (
          <span className="text-xs text-muted-foreground/50 mt-2 inline-block">
            ({word.part_of_speech})
          </span>
        )}
      </div>

      {/* Blanked sentence (only if not hard mode) */}
      {difficulty !== "hard" && (
        <div className="w-full text-center">
          <p className="text-sm text-muted-foreground italic">"{blankedSentence}"</p>
        </div>
      )}

      {/* Hints */}
      {!revealed && difficulty !== "hard" && (
        <GameHint
          onClick={() => setHintsUsed((h) => Math.min(2, h + 1))}
          disabled={hintsUsed >= 2}
          label={hintsUsed === 0 ? "Get a hint (-5 pts)" : hintText}
        />
      )}

      {/* Input */}
      <div className="w-full flex gap-3 mt-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (revealed) handleNext();
              else handleSubmit();
            }
          }}
          disabled={revealed}
          placeholder="Type the word..."
          className={`flex-1 h-12 px-4 rounded-xl border bg-card text-base outline-none transition-colors ${
            revealed
              ? isCorrect
                ? "border-emerald-500 bg-emerald-500/5 text-emerald-500"
                : "border-red-500 bg-red-500/5 text-red-500"
              : "border-border focus:border-accent"
          }`}
        />
        {!revealed ? (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="h-12 px-6 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: examColor.accent }}
          >
            Check
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="h-12 px-6 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted/50 transition-colors flex items-center"
          >
            Next <ArrowRight className="size-4 ml-1" />
          </button>
        )}
      </div>

      {/* Reveal */}
      {revealed && (
        <div
          className={`w-full rounded-xl p-4 text-center text-sm animate-pop ${
            isCorrect ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          }`}
        >
          {isCorrect ? (
            <p className="font-semibold">✓ Correct! The word is "{word.word}"</p>
          ) : (
            <p>
              ✗ The correct answer is{" "}
              <span className="font-bold text-emerald-400">{word.word}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
