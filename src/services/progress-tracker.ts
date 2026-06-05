export interface TestScore {
  testId: string;
  score: number;
  total: number;
  date: string;
}

export interface WritingScore {
  exam: string;
  task: string;
  essay: string;
  bandScore: number;
  feedback: {
    band_score: number;
    overall: string;
    strengths: string[];
    improvements: string[];
    grammar_issues?: { original: string; correction: string; explanation: string }[];
    vocabulary_suggestions?: { word: string; better: string; why: string }[];
    criteria_scores?: {
      task_achievement?: { score: number; comment: string };
      coherence_cohesion?: { score: number; comment: string };
      lexical_resource?: { score: number; comment: string };
      grammatical_range?: { score: number; comment: string };
    };
  };
  date: string;
}

export interface SpeakingScore {
  exam: string;
  task: string;
  bandScore: number;
  feedback: {
    band_score: number;
    overall: string;
    strengths: string[];
    improvements: string[];
    pronunciation_analysis?: string;
    vocabulary_grammar?: string;
    fluency_coherence?: string;
    transcript?: string;
  };
  date: string;
}

export const progressTracker = {
  saveListeningScore(testId: string, score: number, total: number) {
    if (typeof window === "undefined") return;
    try {
      const existing = localStorage.getItem("prepai_listening_scores");
      const list: TestScore[] = existing ? JSON.parse(existing) : [];
      list.push({ testId, score, total, date: new Date().toISOString() });
      localStorage.setItem("prepai_listening_scores", JSON.stringify(list));
    } catch (e) {
      console.error("Failed to save listening score:", e);
    }
  },

  saveReadingScore(testId: string, score: number, total: number) {
    if (typeof window === "undefined") return;
    try {
      const existing = localStorage.getItem("prepai_reading_scores");
      const list: TestScore[] = existing ? JSON.parse(existing) : [];
      list.push({ testId, score, total, date: new Date().toISOString() });
      localStorage.setItem("prepai_reading_scores", JSON.stringify(list));
    } catch (e) {
      console.error("Failed to save reading score:", e);
    }
  },

  saveWritingScore(exam: string, task: string, essay: string, bandScore: number, feedback: any) {
    if (typeof window === "undefined") return;
    try {
      const existing = localStorage.getItem("prepai_writing_scores");
      const list: WritingScore[] = existing ? JSON.parse(existing) : [];
      list.push({ exam, task, essay, bandScore, feedback, date: new Date().toISOString() });
      localStorage.setItem("prepai_writing_scores", JSON.stringify(list));
    } catch (e) {
      console.error("Failed to save writing score:", e);
    }
  },

  saveSpeakingScore(exam: string, task: string, bandScore: number, feedback: any) {
    if (typeof window === "undefined") return;
    try {
      const existing = localStorage.getItem("prepai_speaking_scores");
      const list: SpeakingScore[] = existing ? JSON.parse(existing) : [];
      list.push({ exam, task, bandScore, feedback, date: new Date().toISOString() });
      localStorage.setItem("prepai_speaking_scores", JSON.stringify(list));
    } catch (e) {
      console.error("Failed to save speaking score:", e);
    }
  },

  getListeningScores(): TestScore[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("prepai_listening_scores");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getReadingScores(): TestScore[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("prepai_reading_scores");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getWritingScores(): WritingScore[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("prepai_writing_scores");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getSpeakingScores(): SpeakingScore[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("prepai_speaking_scores");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  clearAllProgress() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("prepai_listening_scores");
    localStorage.removeItem("prepai_reading_scores");
    localStorage.removeItem("prepai_writing_scores");
    localStorage.removeItem("prepai_speaking_scores");
  }
};
