-- ============================================================
-- Vocabulary Words — Cached AI-generated word bank
-- ============================================================
CREATE TABLE public.vocabulary_words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  phonetic TEXT,
  part_of_speech TEXT,
  definition TEXT NOT NULL,
  example_sentence TEXT,
  synonyms TEXT[] DEFAULT '{}',
  distractors TEXT[] DEFAULT '{}',
  exam TEXT NOT NULL,              -- 'ielts' | 'toefl' | 'toeic'
  cefr_level TEXT NOT NULL,        -- 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(word, exam)
);

ALTER TABLE public.vocabulary_words ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read the shared word bank
CREATE POLICY "Allow authenticated read" ON public.vocabulary_words
  FOR SELECT TO authenticated USING (true);

-- Only service role inserts (via server functions)
-- No INSERT/UPDATE/DELETE policies for regular users


-- ============================================================
-- Vocabulary Progress — Per-user spaced repetition tracking
-- ============================================================
CREATE TABLE public.vocabulary_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  word_id UUID NOT NULL REFERENCES public.vocabulary_words(id) ON DELETE CASCADE,
  exam TEXT NOT NULL,
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  last_reviewed TIMESTAMPTZ,
  mastered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, word_id, exam)
);

ALTER TABLE public.vocabulary_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own progress
CREATE POLICY "Users read own progress" ON public.vocabulary_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users insert own progress" ON public.vocabulary_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users update own progress" ON public.vocabulary_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
