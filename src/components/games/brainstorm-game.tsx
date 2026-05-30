import { useState, useEffect, useRef } from "react";
import { useSound } from "@/hooks/use-sound";
import { WordData } from "@/integrations/supabase/types";
import { GameOverScreen, GameTimer, GameHint } from "./game-shared";
import { useGameState } from "@/hooks/use-game-state";
import { ArrowRight, Loader2, Target, CheckCircle2, XCircle } from "lucide-react";
import { validateWordOffline } from "@/services/vocabulary.functions";
import { toast } from "sonner";

export function BrainstormGame({
  words,
  examColor,
  gameState,
  onBack,
}: {
  words: WordData[];
  examColor: { from: string; to: string; accent: string };
  gameState: ReturnType<typeof useGameState>;
  onBack: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<
    { word: string; level: string; points: number; valid: boolean }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [targetLetter, setTargetLetter] = useState("A");
  const [hint, setHint] = useState<{ def: string; length: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const sound = useSound();
  const { state, onWrongAnswer } = gameState;

  // Initialize target letter on mount
  useEffect(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    setTargetLetter(letters[Math.floor(Math.random() * letters.length)]);
    setHint(null);
  }, []);

  // Timer
  useEffect(() => {
    if (roundComplete) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setRoundComplete(true);
          sound.playComplete();
          gameState.updateHighScore("brainstorm", sessionScore);
          gameState.recordGamePlayed();
          return 0;
        }
        if (t <= 5) sound.playTick();
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [roundComplete, sessionScore]);

  // Focus input
  useEffect(() => {
    if (!roundComplete && inputRef.current) inputRef.current.focus();
  }, [roundComplete, loading]);

  const handleHint = () => {
    if (hint || roundComplete) return;

    // Find a word containing the target letter that hasn't been guessed
    const guessedWords = history.map((h) => h.word);
    const validWords = words.filter(
      (w) =>
        w.word.toLowerCase().includes(targetLetter.toLowerCase()) &&
        !guessedWords.includes(w.word.toLowerCase()),
    );

    if (validWords.length > 0) {
      setSessionScore((s) => Math.max(0, s - 5));
      const randomWord = validWords[Math.floor(Math.random() * validWords.length)];
      setHint({ def: randomWord.definition, length: randomWord.word.length });
    } else {
      toast.error("No hints left for this letter!");
    }
  };

  const handleSubmit = async () => {
    const w = input.trim().toLowerCase();
    if (!w || loading || roundComplete) return;

    if (history.some((h) => h.word === w)) {
      setInput("");
      return; // Already submitted
    }

    if (!w.includes(targetLetter.toLowerCase())) {
      sound.playWrong();
      setHistory((prev) => [{ word: w, level: "N/A", points: 0, valid: false }, ...prev]);
      setInput("");
      onWrongAnswer(false); // don't cost a heart for typos, it just wastes time
      return;
    }

    setLoading(true);
    try {
      const res = await validateWordOffline({ data: { word: w } });

      if (res.valid) {
        sound.playCorrect();
        const pts = res.points || 2;

        setSessionScore((s) => s + pts);
        setSessionXP((x) => x + pts);
        setHistory((prev) => [{ word: w, level: res.level, points: pts, valid: true }, ...prev]);
      } else {
        sound.playWrong();
        setHistory((prev) => [{ word: w, level: "N/A", points: 0, valid: false }, ...prev]);
      }
    } catch (err) {
      console.error(err);
      sound.playWrong();
    } finally {
      setLoading(false);
      setInput("");
      setHint(null); // Clear hint on successful or failed guess to reset for next word
      if (inputRef.current) inputRef.current.focus();
    }
  };

  if (roundComplete) {
    return (
      <GameOverScreen
        title="Time's Up! ⏱️"
        subtitle={`You brainstormed ${history.filter((h) => h.valid).length} valid words.`}
        score={sessionScore}
        xpEarned={sessionXP}
        onPlayAgain={() => {
          setHistory([]);
          setTimeLeft(60);
          setRoundComplete(false);
          setSessionScore(0);
          setSessionXP(0);
          setHint(null);
          const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          setTargetLetter(letters[Math.floor(Math.random() * letters.length)]);
        }}
        onBackToMenu={onBack}
        accentColor={examColor.accent}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 max-w-md mx-auto w-full animate-slide-up bg-card p-6 rounded-[32px] shadow-sm border-2 border-border relative overflow-hidden">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="px-3 py-1 bg-muted rounded-full flex items-center gap-2 font-bold text-sm text-foreground">
          <Target className="size-4 text-amber-500" /> Score: {sessionScore}
        </div>
        <div className="px-3 py-1 bg-emerald-500/10 rounded-full flex items-center gap-2 font-bold text-sm text-emerald-500">
          {timeLeft}s remaining
        </div>
      </div>

      <div className="w-full mt-4 z-10 flex justify-center">
        <GameTimer
          timeLeft={timeLeft}
          maxTime={60}
          accentColor={examColor.accent}
          danger={timeLeft <= 10}
        />
      </div>

      {/* Target Prompt */}
      <div className="w-full my-6 text-center z-10">
        <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-2">
          Words Containing
        </p>
        <div
          className="text-6xl font-black"
          style={{ color: examColor.accent, textShadow: `0 0 30px ${examColor.from}40` }}
        >
          {targetLetter}
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-2 mb-2">
        <GameHint
          onClick={handleHint}
          disabled={hint !== null}
          label={hint ? "Hint Active" : "Get Hint (-5 pts)"}
        />
        {hint && (
          <div className="text-sm text-center text-orange-500 font-medium px-4 py-2 bg-orange-500/10 rounded-lg animate-fade-in border border-orange-500/20 mt-2">
            <span className="font-bold tracking-widest block mb-1">
              {"_ ".repeat(hint.length).trim()}
            </span>
            {hint.def}
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="w-full flex gap-2 z-10">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            disabled={loading}
            placeholder="Type a word..."
            className="w-full h-14 bg-muted/50 border-2 border-border rounded-2xl px-5 text-lg font-bold text-foreground outline-none focus:border-accent transition-colors shadow-inner"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="size-5 text-accent animate-spin" />
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || loading}
          className="h-14 w-14 flex items-center justify-center text-white rounded-2xl transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: examColor.accent }}
        >
          <ArrowRight className="size-6" />
        </button>
      </div>

      {/* History Log */}
      <div className="w-full flex flex-col gap-2 mt-6 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar z-10">
        {history.map((h, i) => (
          <div
            key={i}
            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 ${h.valid ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-red-500/10 border-red-500/30 text-red-500"}`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {h.valid ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
              {h.word}
            </div>
            {h.valid && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/20">
                  {h.level}
                </span>
                <span className="font-extrabold">+{h.points}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
