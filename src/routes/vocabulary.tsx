import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ShareButton } from "@/components/share-button";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSound } from "@/hooks/use-sound";
import {
  getVocabularyWords,
  getWritingPhrases,
  getUserStats,
  updateWordProgress,
} from "@/services/vocabulary.functions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Flame,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  Music,
  Music2,
  Gamepad2,
  ArrowLeft,
  RotateCcw,
  Check,
  X,
  Zap,
  Shield,
  Heart,
  Clock,
  Timer,
  Shuffle,
  MessageSquare,
  Type,
  Rocket,
} from "lucide-react";

// New Game State & Shared UI
import { useGameState } from "@/hooks/use-game-state";
import { XPBar, GameOverScreen, Confetti, RoundIndicator } from "@/components/games/game-shared";
import { ClassicGame } from "@/components/games/classic-game";
import { GuessWordGame } from "@/components/games/guess-word-game";
import { TestGame } from "@/components/games/test-game";
import { SurvivalGame, ScrambleGame } from "@/components/games/fun-games";
import { SpellingRushGame } from "@/components/games/spelling-rush-game";
import { SentenceQuizGame } from "@/components/games/sentence-quiz";
import { BrainstormGame } from "@/components/games/brainstorm-game";
import { PhraseQuizGame } from "@/components/games/phrase-quiz-game";
import { WordData } from "@/integrations/supabase/types";

export const Route = createFileRoute("/vocabulary")({
  component: VocabularyPage,
});

type Exam = "ielts" | "toefl" | "toeic";
type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type GameMode =
  | "classic"
  | "guess"
  | "test"
  | "survival"
  | "scramble"
  | "flashcards"
  | "match"
  | "rush"
  | "sentence"
  | "brainstorm"
  | "phrases";

const examColors: Record<Exam, { from: string; to: string; accent: string }> = {
  ielts: { from: "#8b5cf6", to: "#3b82f6", accent: "rgb(139, 92, 246)" },
  toefl: { from: "#f97316", to: "#eab308", accent: "rgb(249, 115, 22)" },
  toeic: { from: "#14b8a6", to: "#06b6d4", accent: "rgb(20, 184, 166)" },
};

// ── Flashcards Game (Adapted for new state) ────────────────────────────────

function FlashcardsGame({
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
  const [flipped, setFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"" | "left" | "right">("");
  const [roundComplete, setRoundComplete] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);

  const word = words[currentIndex];
  const { onCorrectAnswer, onWrongAnswer } = gameState;

  const handleFlip = () => {
    setFlipped(!flipped);
    sound.playFlip();
  };

  const handleSwipe = (correct: boolean) => {
    if (correct) {
      sound.playCorrect();
      setSessionXP((x) => x + 5);
      onCorrectAnswer(word.id, 5);
    } else {
      sound.playWrong();
      onWrongAnswer(false); // Flashcards don't cost hearts
    }
    onResult(word.id, correct);
    setSlideDirection(correct ? "right" : "left");

    setTimeout(() => {
      setFlipped(false);
      setSlideDirection("");
      if (currentIndex < words.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setRoundComplete(true);
        sound.playComplete();
        gameState.recordGamePlayed();
      }
    }, 300);
  };

  if (roundComplete) {
    return (
      <GameOverScreen
        title="Flashcards Complete!"
        score={sessionXP * 2}
        xpEarned={sessionXP}
        onPlayAgain={() => {
          setCurrentIndex(0);
          setFlipped(false);
          setRoundComplete(false);
          setSessionXP(0);
        }}
        onBackToMenu={onBack}
        accentColor={examColor.accent}
      />
    );
  }

  if (!word) return null;

  return (
    <div className="flex flex-col items-center gap-6 max-w-lg mx-auto w-full animate-slide-up">
      <div className="w-full mb-2">
        <RoundIndicator
          current={currentIndex}
          total={words.length}
          accentColor={examColor.accent}
        />
      </div>
      <div className="text-sm font-semibold text-muted-foreground/60">
        Swipe or click buttons below
      </div>

      <div
        className={`w-full max-w-md aspect-[3/4] perspective-1000 cursor-pointer transition-transform duration-300 ${
          slideDirection === "right"
            ? "translate-x-[120%] rotate-12 opacity-0"
            : slideDirection === "left"
              ? "-translate-x-[120%] -rotate-12 opacity-0"
              : ""
        }`}
        onClick={handleFlip}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border border-border/50 p-8 flex flex-col items-center justify-center text-center bg-card shadow-xl"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div
              className="text-5xl font-bold tracking-tight mb-3"
              style={{
                background: `linear-gradient(135deg, ${examColor.from}, ${examColor.to})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {word.word}
            </div>
            {word.phonetic && <p className="text-lg text-muted-foreground mb-2">{word.phonetic}</p>}
            <p className="text-sm text-muted-foreground/50 mt-8">Tap to reveal</p>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border border-border/50 p-8 flex flex-col items-center justify-center text-center overflow-y-auto bg-card shadow-xl"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-xl font-semibold mb-3">{word.definition}</p>
            {word.example_sentence && (
              <p className="text-sm text-muted-foreground italic mb-4">"{word.example_sentence}"</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-4 w-full max-w-md">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
          onClick={() => handleSwipe(false)}
        >
          <X className="size-5" /> Still learning
        </Button>
        <Button
          size="lg"
          className="flex-1 gap-2 text-white"
          style={{ background: examColor.accent }}
          onClick={() => handleSwipe(true)}
        >
          <Check className="size-5" /> I know it
        </Button>
      </div>
    </div>
  );
}

// ── Match Game (Adapted for new state) ──────────────────────────────────

function MatchGame({
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
  const matchWords = words.slice(0, 5);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ word: string; def: string } | null>(null);
  const [roundComplete, setRoundComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);

  const { onCorrectAnswer, onWrongAnswer } = gameState;

  const shuffledDefs = useMemo(() => {
    const defs = matchWords.map((w) => ({ id: w.id, definition: w.definition }));
    for (let i = defs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [defs[i], defs[j]] = [defs[j], defs[i]];
    }
    return defs;
  }, [matchWords]);

  useEffect(() => {
    if (selectedWord && selectedDef) {
      const wordObj = matchWords.find((w) => w.id === selectedWord);
      const defObj = shuffledDefs.find((d) => d.id === selectedDef);

      if (wordObj && defObj && wordObj.id === defObj.id) {
        sound.playMatch();
        onResult(wordObj.id, true);
        onCorrectAnswer(wordObj.id, 10);
        setSessionScore((s) => s + 20);
        setMatched((prev) => new Set([...prev, wordObj.id]));
        setSelectedWord(null);
        setSelectedDef(null);
        if (matched.size + 1 === matchWords.length) {
          setTimeout(() => {
            setRoundComplete(true);
            sound.playComplete();
            gameState.recordGamePlayed();
          }, 500);
        }
      } else {
        sound.playWrong();
        onWrongAnswer(true);
        if (wordObj) onResult(wordObj.id, false);
        setWrongPair({ word: selectedWord, def: selectedDef });
        setTimeout(() => {
          setSelectedWord(null);
          setSelectedDef(null);
          setWrongPair(null);
        }, 600);
      }
    }
  }, [selectedWord, selectedDef]);

  if (roundComplete) {
    return (
      <GameOverScreen
        title="All Matched!"
        score={sessionScore}
        xpEarned={50}
        onPlayAgain={() => {
          setMatched(new Set());
          setSelectedWord(null);
          setSelectedDef(null);
          setRoundComplete(false);
          setSessionScore(0);
        }}
        onBackToMenu={onBack}
        accentColor={examColor.accent}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      <div className="text-sm text-muted-foreground text-center">
        Matched: {matched.size} / {matchWords.length}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">
            Words
          </p>
          {matchWords.map((w) => {
            const isMatched = matched.has(w.id),
              isSelected = selectedWord === w.id,
              isWrong = wrongPair?.word === w.id;
            return (
              <button
                key={w.id}
                onClick={() => {
                  if (!isMatched) setSelectedWord(isSelected ? null : w.id);
                }}
                disabled={isMatched}
                className={`p-4 rounded-xl border text-left text-sm font-semibold transition-all duration-200 ${
                  isMatched
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500 opacity-60"
                    : isWrong
                      ? "border-red-500 bg-red-500/10 animate-shake"
                      : isSelected
                        ? "border-accent bg-accent/10 ring-2 ring-accent/30"
                        : "border-border bg-card hover:border-accent/30"
                }`}
              >
                {w.word}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">
            Definitions
          </p>
          {shuffledDefs.map((d) => {
            const isMatched = matched.has(d.id),
              isSelected = selectedDef === d.id,
              isWrong = wrongPair?.def === d.id;
            return (
              <button
                key={d.id}
                onClick={() => {
                  if (!isMatched) setSelectedDef(isSelected ? null : d.id);
                }}
                disabled={isMatched}
                className={`p-4 rounded-xl border text-left text-sm transition-all duration-200 ${
                  isMatched
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500 opacity-60"
                    : isWrong
                      ? "border-red-500 bg-red-500/10 animate-shake"
                      : isSelected
                        ? "border-accent bg-accent/10 ring-2 ring-accent/30"
                        : "border-border bg-card hover:border-accent/30"
                }`}
              >
                {d.definition}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard & Hub ──────────────────────────────────────

function VocabularyPage() {
  const { user } = useAuth();
  const sound = useSound();
  const gameState = useGameState();

  const [exam, setExam] = useState<Exam>("ielts");
  const [level, setLevel] = useState<CEFRLevel>("B2");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedExam = localStorage.getItem("vocab_exam") as Exam;
      if (savedExam) setExam(savedExam);
      const savedLevel = localStorage.getItem("vocab_level") as CEFRLevel;
      if (savedLevel) setLevel(savedLevel);
    }
  }, []);

  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [words, setWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sfxOn, setSfxOn] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<"lofi" | "upbeat" | "intense" | "ethereal">(
    "lofi",
  );

  // Sync initial track state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentTrack(sound.getCurrentTrack() as "lofi" | "upbeat" | "intense" | "ethereal");
    }
  }, []);

  const cycleTrack = () => {
    const tracks = ["lofi", "upbeat", "intense", "ethereal"] as const;
    const nextTrack = tracks[(tracks.indexOf(currentTrack) + 1) % tracks.length];
    setCurrentTrack(nextTrack);
    sound.changeMusicTrack(nextTrack);
  };

  useEffect(() => {
    localStorage.setItem("vocab_exam", exam);
  }, [exam]);
  useEffect(() => {
    localStorage.setItem("vocab_level", level);
  }, [level]);

  const loadWords = async (mode: GameMode) => {
    setLoading(true);
    setGameMode(mode);
    try {
      const data =
        mode === "phrases"
          ? await getWritingPhrases({
              data: { exam, cefrLevel: level, count: 10, userId: user?.id },
            })
          : await getVocabularyWords({
              data: { exam, cefrLevel: level, count: mode === "match" ? 5 : 20, userId: user?.id },
            });
      setWords(data as WordData[]);
    } catch (err) {
      toast.error("Failed to load vocabulary words.");
      setGameMode(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResult = useCallback(
    async (wordId: string, correct: boolean) => {
      if (!user) return;
      try {
        await updateWordProgress({ data: { userId: user.id, wordId, exam, correct } });
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    },
    [user, exam],
  );

  const examColor = examColors[exam];
  const {
    percent: xpPercent,
    level: currentLevel,
    current: xpCurrent,
    needed: xpNeeded,
  } = gameState.getLevelProgress();

  const gameModes: { id: GameMode; icon: React.ReactNode; name: string; desc: string }[] = [
    {
      id: "phrases",
      icon: <Type className="size-6 text-indigo-500" />,
      name: "Writing Phrases",
      desc: "Learn popular idioms & collocations",
    },
    {
      id: "rush",
      icon: <Rocket className="size-6 text-indigo-500" />,
      name: "Spelling Rush",
      desc: "3-Phase Spelling & Rush!",
    },
    {
      id: "sentence",
      icon: <MessageSquare className="size-6 text-amber-500" />,
      name: "Sentence Quiz",
      desc: "Fill in the blank context",
    },
    {
      id: "brainstorm",
      icon: <Type className="size-6 text-emerald-400" />,
      name: "Brainstorm",
      desc: "Type words, earn CEFR points!",
    },
    {
      id: "classic",
      icon: <Timer className="size-6 text-blue-500" />,
      name: "Classic Quiz",
      desc: "Fast-paced definition matching",
    },
    {
      id: "guess",
      icon: <Check className="size-6 text-emerald-500" />,
      name: "Guess Word",
      desc: "Type the missing word",
    },
    {
      id: "test",
      icon: <Shield className="size-6 text-purple-500" />,
      name: "Test Mode",
      desc: "No timer, deep focus",
    },
    {
      id: "survival",
      icon: <Flame className="size-6 text-orange-500" />,
      name: "Survival",
      desc: "Endless mode, time shrinks!",
    },
    {
      id: "scramble",
      icon: <Shuffle className="size-6 text-pink-500" />,
      name: "Scramble",
      desc: "Unscramble the letters",
    },
    {
      id: "flashcards",
      icon: <Zap className="size-6 text-yellow-500" />,
      name: "Flashcards",
      desc: "Flip & learn at your own pace",
    },
    {
      id: "match",
      icon: <Star className="size-6 text-cyan-500" />,
      name: "Match",
      desc: "Pair words & meanings",
    },
  ];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <PageHeader title="Word Arena" description="Master your exam vocabulary through play.">
            <ShareButton
              title="Word Arena — PassAsistant"
              description="Master English exam vocabulary through fun gamified quizzes, matches, and brainstorms!"
            />
          </PageHeader>
          <div className="flex items-center gap-2 self-start">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSfxOn(!sfxOn);
                sound.setSfxEnabled(!sfxOn);
              }}
              className={!sfxOn ? "opacity-50" : ""}
            >
              {sfxOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </Button>
            <div className="flex items-center bg-card rounded-md border border-border">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMusicOn(sound.toggleMusic())}
                className={`rounded-r-none ${!musicOn ? "opacity-50" : "text-accent bg-accent/10"}`}
              >
                {musicOn ? <Music2 className="size-4" /> : <Music className="size-4" />}
              </Button>
              {musicOn && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cycleTrack}
                  className="rounded-l-none border-l border-border text-xs uppercase tracking-widest font-bold"
                >
                  {currentTrack}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Top Bar (XP, Level, Hearts, Stats) */}
        {!gameMode && (
          <div className="grid lg:grid-cols-3 gap-6 mb-8 animate-slide-up">
            {/* Player Card */}
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${examColor.from}, ${examColor.to})`,
                }}
              />

              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div
                    className="size-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${examColor.from}, ${examColor.to})`,
                    }}
                  >
                    Lv.{currentLevel}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Vocabulary Master</h2>
                    <p className="text-sm text-muted-foreground">
                      {gameState.state.totalXP.toLocaleString()} Total XP
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2 relative z-10">
                <XPBar
                  level={currentLevel}
                  current={xpCurrent}
                  needed={xpNeeded}
                  percent={xpPercent}
                  accentColor={examColor.accent}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-2xl border border-border bg-card p-6 grid grid-cols-2 gap-4 shadow-sm">
              <div>
                <div className="flex items-center gap-1.5 text-orange-500 font-bold mb-1">
                  <Flame className="size-4" /> {gameState.state.bestCombo}x
                </div>
                <div className="text-xs text-muted-foreground">Best Combo</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-yellow-500 font-bold mb-1">
                  <Star className="size-4" /> {gameState.state.score.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Total Score</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-emerald-500 font-bold mb-1">
                  <Check className="size-4" /> {gameState.state.wordsLearned.length}
                </div>
                <div className="text-xs text-muted-foreground">Words Learned</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-blue-500 font-bold mb-1">
                  <Trophy className="size-4" /> {gameState.state.gamesPlayed}
                </div>
                <div className="text-xs text-muted-foreground">Games Played</div>
              </div>
            </div>
          </div>
        )}

        {/* Game Area */}
        <div className="w-full">
          {!gameMode ? (
            <div className="animate-slide-up">
              {/* Exam & Level Selectors */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 rounded-xl border border-border bg-card p-4 flex items-center justify-between shadow-sm">
                  <div className="text-sm font-semibold text-muted-foreground">Target Exam</div>
                  <div className="flex gap-2">
                    {(["ielts", "toefl", "toeic"] as Exam[]).map((e) => (
                      <button
                        key={e}
                        onClick={() => setExam(e)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${exam === e ? "text-white shadow-md" : "hover:bg-muted/50"}`}
                        style={
                          exam === e
                            ? {
                                background: `linear-gradient(135deg, ${examColors[e].from}, ${examColors[e].to})`,
                              }
                            : {}
                        }
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 rounded-xl border border-border bg-card p-4 flex items-center justify-between shadow-sm overflow-x-auto">
                  <div className="text-sm font-semibold text-muted-foreground mr-4">CEFR Level</div>
                  <div className="flex gap-1">
                    {(["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLevel(l)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${level === l ? "text-white shadow-md" : "hover:bg-muted/50"}`}
                        style={level === l ? { background: examColor.accent } : {}}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Game Modes Grid */}
              <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                <Gamepad2 className="size-5" /> Select Game Mode
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gameModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => loadWords(mode.id)}
                    disabled={loading}
                    className="group flex items-start gap-4 p-5 rounded-2xl border border-border bg-card text-left transition-all duration-300 hover:border-accent hover:shadow-lg hover:-translate-y-1 overflow-hidden relative"
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${examColor.from}, ${examColor.to})`,
                      }}
                    />
                    <div className="p-3 rounded-xl bg-muted/50 transition-colors group-hover:bg-accent/10">
                      {mode.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-accent transition-colors">
                        {mode.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{mode.desc}</p>

                      {gameState.state.highScores[mode.id] > 0 && (
                        <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-xs font-bold">
                          Best: {gameState.state.highScores[mode.id]}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full">
              {/* Active Game Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b">
                <Button variant="ghost" onClick={() => setGameMode(null)} className="gap-2">
                  <ArrowLeft className="size-4" /> Back to Hub
                </Button>
                <div className="flex items-center gap-4">
                  <div
                    className="px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${examColor.from}, ${examColor.to})`,
                    }}
                  >
                    {gameMode.toUpperCase()}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                  <Loader2 className="size-8 animate-spin mb-4" />
                  <p>Loading words...</p>
                </div>
              ) : (
                <div className="w-full min-h-[400px]">
                  {gameMode === "rush" && (
                    <SpellingRushGame
                      words={words}
                      onResult={handleResult}
                      sound={sound}
                      examColor={examColor}
                      gameState={gameState}
                      onBack={() => setGameMode(null)}
                    />
                  )}
                  {gameMode === "sentence" && (
                    <SentenceQuizGame
                      words={words}
                      onResult={handleResult}
                      sound={sound}
                      examColor={examColor}
                      gameState={gameState}
                      onBack={() => setGameMode(null)}
                    />
                  )}
                  {gameMode === "brainstorm" && (
                    <BrainstormGame
                      words={words}
                      examColor={examColor}
                      gameState={gameState}
                      onBack={() => setGameMode(null)}
                    />
                  )}
                  {gameMode === "classic" && (
                    <ClassicGame
                      words={words}
                      onResult={handleResult}
                      sound={sound}
                      examColor={examColor}
                      gameState={gameState}
                      onBack={() => setGameMode(null)}
                    />
                  )}
                  {gameMode === "guess" && (
                    <GuessWordGame
                      words={words}
                      onResult={handleResult}
                      sound={sound}
                      examColor={examColor}
                      gameState={gameState}
                      onBack={() => setGameMode(null)}
                    />
                  )}
                  {gameMode === "test" && (
                    <TestGame
                      words={words}
                      onResult={handleResult}
                      sound={sound}
                      examColor={examColor}
                      gameState={gameState}
                      onBack={() => setGameMode(null)}
                    />
                  )}
                  {gameMode === "survival" && (
                    <SurvivalGame
                      words={words}
                      onResult={handleResult}
                      sound={sound}
                      examColor={examColor}
                      gameState={gameState}
                      onBack={() => setGameMode(null)}
                    />
                  )}
                  {gameMode === "scramble" && (
                    <ScrambleGame
                      words={words}
                      onResult={handleResult}
                      sound={sound}
                      examColor={examColor}
                      gameState={gameState}
                      onBack={() => setGameMode(null)}
                    />
                  )}
                  {gameMode === "flashcards" && (
                    <FlashcardsGame
                      words={words}
                      onResult={handleResult}
                      sound={sound}
                      examColor={examColor}
                      gameState={gameState}
                      onBack={() => setGameMode(null)}
                    />
                  )}
                  {gameMode === "match" && (
                    <MatchGame
                      words={words}
                      onResult={handleResult}
                      sound={sound}
                      examColor={examColor}
                      gameState={gameState}
                      onBack={() => setGameMode(null)}
                    />
                  )}
                  {gameMode === "phrases" && (
                    <PhraseQuizGame
                      words={words}
                      onResult={handleResult}
                      sound={sound}
                      examColor={examColor}
                      gameState={gameState}
                      onBack={() => setGameMode(null)}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
