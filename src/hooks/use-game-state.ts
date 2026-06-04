import { useState, useCallback, useEffect, useRef } from "react";

// ──────────────────────────────────────────────────
// Shared game state: Hearts, Score, XP, Combo, Level
// Persisted to localStorage, synced across games
// ──────────────────────────────────────────────────

const STORAGE_KEY = "word_arena_state";
const MAX_HEARTS = 5;
const HEART_REGEN_MS = 30 * 60 * 1000; // 30 minutes per heart

// XP thresholds for each level
const LEVEL_THRESHOLDS = [
  0, 50, 120, 220, 350, 520, 730, 1000, 1350, 1800, 2400, 3200, 4200, 5500, 7200, 9500,
];

export interface GameState {
  score: number;
  totalXP: number;
  level: number;
  combo: number;
  bestCombo: number;
  wordsLearned: string[]; // word IDs the user has seen
  wordsMastered: string[]; // word IDs the user got right 3+ times
  gamesPlayed: number;
  highScores: Record<string, number>; // gameMode → best score
  dailyGoal: number; // words per day
  dailyProgress: number;
  dailyDate: string; // "YYYY-MM-DD"
}

const defaultState: GameState = {
  score: 0,
  totalXP: 0,
  level: 1,
  combo: 0,
  bestCombo: 0,
  wordsLearned: [],
  wordsMastered: [],
  gamesPlayed: 0,
  highScores: {},
  dailyGoal: 20,
  dailyProgress: 0,
  dailyDate: new Date().toISOString().split("T")[0],
};

function loadState(): GameState {
  if (typeof window === "undefined") return { ...defaultState };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw) as GameState;

    // Reset daily progress if it's a new day
    const today = new Date().toISOString().split("T")[0];
    if (parsed.dailyDate !== today) {
      parsed.dailyProgress = 0;
      parsed.dailyDate = today;
    }

    return { ...defaultState, ...parsed };
  } catch {
    return { ...defaultState };
  }
}

function saveState(state: GameState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getLevelProgress(xp: number): {
  level: number;
  current: number;
  needed: number;
  percent: number;
} {
  const level = getLevel(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 500;
  const current = xp - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  return { level, current, needed, percent: Math.min(100, (current / needed) * 100) };
}

export function useGameState() {
  const [state, setState] = useState<GameState>(loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const addXP = useCallback((amount: number) => {
    setState((prev) => {
      const newXP = prev.totalXP + amount;
      return { ...prev, totalXP: newXP, level: getLevel(newXP) };
    });
  }, []);

  const addScore = useCallback((points: number) => {
    setState((prev) => ({ ...prev, score: prev.score + points }));
  }, []);

  const incrementCombo = useCallback(() => {
    setState((prev) => {
      const newCombo = prev.combo + 1;
      return {
        ...prev,
        combo: newCombo,
        bestCombo: Math.max(prev.bestCombo, newCombo),
      };
    });
  }, []);

  const resetCombo = useCallback(() => {
    setState((prev) => ({ ...prev, combo: 0 }));
  }, []);

  const markWordLearned = useCallback((wordId: string) => {
    setState((prev) => {
      if (prev.wordsLearned.includes(wordId)) return prev;
      return {
        ...prev,
        wordsLearned: [...prev.wordsLearned, wordId],
        dailyProgress: prev.dailyProgress + 1,
      };
    });
  }, []);

  const markWordMastered = useCallback((wordId: string) => {
    setState((prev) => {
      if (prev.wordsMastered.includes(wordId)) return prev;
      return { ...prev, wordsMastered: [...prev.wordsMastered, wordId] };
    });
  }, []);

  const recordGamePlayed = useCallback(() => {
    setState((prev) => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1 }));
  }, []);

  const updateHighScore = useCallback((gameMode: string, score: number) => {
    setState((prev) => {
      const current = prev.highScores[gameMode] || 0;
      if (score <= current) return prev;
      return { ...prev, highScores: { ...prev.highScores, [gameMode]: score } };
    });
  }, []);

  // Correct answer handler — bundles common operations
  const onCorrectAnswer = useCallback(
    (wordId: string, xpAmount = 10) => {
      incrementCombo();
      addXP(xpAmount);
      markWordLearned(wordId);
      const comboMultiplier = Math.min(4, 1 + Math.floor(stateRef.current.combo / 5));
      addScore(10 * comboMultiplier);
    },
    [incrementCombo, addXP, markWordLearned, addScore],
  );

  // Wrong answer handler
  const onWrongAnswer = useCallback((_costHeart?: boolean) => {
    resetCombo();
  }, [resetCombo]);

  return {
    state,
    addXP,
    addScore,
    incrementCombo,
    resetCombo,
    markWordLearned,
    markWordMastered,
    recordGamePlayed,
    updateHighScore,
    onCorrectAnswer,
    onWrongAnswer,
    getLevelProgress: () => getLevelProgress(state.totalXP),
  };
}
