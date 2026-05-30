import { useState, useMemo, useEffect } from "react";
import { WordData } from "@/integrations/supabase/types";
import { useSound } from "@/hooks/use-sound";
import { GameOverScreen, Confetti, RoundIndicator, GameTimer, GameHint } from "./game-shared";
import { useGameState } from "@/hooks/use-game-state";
import { AlertTriangle } from "lucide-react";

export function SentenceQuizGame({
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
  const [eliminated, setEliminated] = useState<number[]>([]);

  const word = words[currentIndex];
  const { state, onCorrectAnswer, onWrongAnswer } = gameState;

  const { sentence, options, correctIndex } = useMemo(() => {
    if (!word || !word.example_sentence) return { sentence: "", options: [], correctIndex: 0 };

    // Replace the exact word in the sentence with blanks
    const regex = new RegExp(`\\b${word.word}\\b`, "gi");
    const blanked = word.example_sentence.replace(regex, "________");

    const opts = [word.word];
    // Gather distractors from other words in the list to make it hard
    while (opts.length < 4) {
      const other = words[Math.floor(Math.random() * words.length)];
      if (other.id !== word.id && !opts.includes(other.word)) {
        opts.push(other.word);
      }
    }

    // Shuffle options
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }

    return { sentence: blanked, options: opts, correctIndex: opts.indexOf(word.word) };
  }, [word, words]);

  const handleHint = () => {
    if (eliminated.length > 0 || selected !== null) return;
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
      setSessionScore((s) => s + 15);
      setSessionXP((x) => x + 10);
      onCorrectAnswer(word.id, 10);
    } else {
      sound.playWrong();
      onWrongAnswer(true);
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
        gameState.updateHighScore("sentence", sessionScore);
        gameState.recordGamePlayed();
      }
    }, 1500);
  };

  if (roundComplete) {
    return (
      <GameOverScreen
        title="Quiz Complete! 🌟"
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

  if (!word || !sentence) return null;

  return (
    <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto w-full animate-slide-up px-2">
      <Confetti
        active={
          state.combo > 0 && state.combo % 5 === 0 && selected !== null && selected === correctIndex
        }
      />

      <div className="w-full flex items-center justify-between mb-4">
        <RoundIndicator
          current={currentIndex}
          total={words.length}
          accentColor={examColor.accent}
        />
        <GameHint
          onClick={handleHint}
          disabled={eliminated.length > 0 || selected !== null}
          label={eliminated.length > 0 ? "Hint Used" : "50/50 (-5 pts)"}
        />
        <div className="text-xl font-bold text-accent drop-shadow-sm">{sessionScore} pts ✨</div>
      </div>

      {/* Main Question Card matching site style */}
      <div className="w-full bg-card rounded-[24px] border-2 border-border overflow-hidden shadow-sm relative">
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{ background: `linear-gradient(90deg, ${examColor.from}, ${examColor.to})` }}
        />

        {/* Header inside card */}
        <div className="flex justify-between items-center p-6 pb-2">
          <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground/80">
            Fill the Blank
          </span>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs font-bold hover:bg-muted transition-colors">
              Report <AlertTriangle className="size-3 text-amber-500" />
            </button>
            <div
              className="px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-md"
              style={{ background: examColor.accent }}
            >
              {word.cefr_level}
            </div>
          </div>
        </div>

        {/* Sentence */}
        <div className="p-6 md:p-10 text-center min-h-[200px] flex items-center justify-center">
          <h2 className="text-2xl md:text-3xl font-extrabold leading-relaxed text-foreground">
            {sentence}
          </h2>
        </div>
      </div>

      {/* Options Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {options.map((opt, idx) => {
          const isCorrectOption = idx === correctIndex;
          const isSelected = idx === selected;
          const isEliminated = eliminated.includes(idx);
          let style = isEliminated
            ? "opacity-20 cursor-not-allowed border-dashed bg-card"
            : "bg-card text-foreground border-border hover:border-accent/50 hover:bg-accent/5";

          if (selected !== null && !isEliminated) {
            if (isCorrectOption)
              style =
                "bg-emerald-500/10 text-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
            else if (isSelected) style = "bg-red-500/10 text-red-500 border-red-500 animate-shake";
            else style = "opacity-40 bg-card border-border";
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selected !== null || isEliminated}
              className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${style}`}
            >
              <div className="size-6 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center mb-1">
                {String.fromCharCode(65 + idx)}
              </div>
              <span className="text-xl font-bold">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
