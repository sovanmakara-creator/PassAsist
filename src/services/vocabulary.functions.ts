import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { EnglishLexicon } from "english-lexicon";
import { callGeminiWithFallback } from "./gemini-helper";

// ---------------------------------------------------------------------------
// Generate exam-specific vocabulary words via Gemini and cache in Supabase
// ---------------------------------------------------------------------------
export const getVocabularyWords = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { exam: string; cefrLevel: string; count?: number; userId?: string };
  }) => {
    const { exam, cefrLevel, count = 10, userId } = data;
    const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
    if (!apiKey) throw new Error("AI is not configured");

    let reviewWords: any[] = [];
    const seenWordIds = new Set<string>();

    if (userId) {
      // 1. Get user progress to find due review words
      const { data: progress } = await supabaseAdmin
        .from("vocabulary_progress")
        .select("word_id, next_review, vocabulary_words(*)")
        .eq("user_id", userId)
        .eq("exam", exam);

      if (progress) {
        progress.forEach((p: any) => seenWordIds.add(p.word_id));
        const now = new Date().toISOString();
        const due = progress.filter((p: any) => p.next_review <= now);

        // Shuffle due words
        due.sort(() => Math.random() - 0.5);
        // Take up to half the requested count as review words
        const reviewCount = Math.min(Math.floor(count / 2), due.length);
        reviewWords = due.slice(0, reviewCount).map((p: any) => p.vocabulary_words);
      }
    }

    const neededNewWordsCount = count - reviewWords.length;
    let newWords: any[] = [];

    // 2. Fetch cache to find unseen words
    const { data: cached } = await supabaseAdmin
      .from("vocabulary_words")
      .select("*")
      .eq("exam", exam)
      .eq("cefr_level", cefrLevel);

    const unseenCached = (cached || []).filter((w) => !seenWordIds.has(w.id));
    unseenCached.sort(() => Math.random() - 0.5);

    newWords = unseenCached.slice(0, neededNewWordsCount);

    // 3. Generate more words via Gemini if we don't have enough unseen words
    if (newWords.length < neededNewWordsCount) {
      const generateCount = Math.max(10, neededNewWordsCount - newWords.length);
      const existingWords = (cached || []).map((w) => w.word).join(", ");

      const examLabels: Record<string, string> = {
        ielts: "IELTS academic reading and writing",
        toefl: "TOEFL iBT academic vocabulary",
        toeic: "TOEIC business and workplace communication",
      };

      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Generate ${generateCount} highly advanced and sophisticated English vocabulary words at CEFR level ${cefrLevel} (or push towards the upper boundaries of that level) that are specifically critical for the ${examLabels[exam] || exam} exam. Use today's date "${new Date().toISOString().split("T")[0]}" and a random factor "${Math.random().toString(36).slice(2)}" as seeds so each request produces wildly different, rare words. Do NOT repeat any of these words: [${existingWords}]. Do NOT generate basic, common, or easy words. Every word should challenge the user and feel highly sophisticated.`,
              },
            ],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: `You are an expert English vocabulary tutor specializing in advanced ${examLabels[exam] || exam} exam preparation. Return a JSON array of ${generateCount} word objects. Each object must have: "word" (string), "phonetic" (string, IPA pronunciation), "partOfSpeech" (string), "definition" (string, clear and concise), "exampleSentence" (string, natural sophisticated sentence using the word in an exam-relevant context), "synonyms" (array of 2-3 strings), "distractors" (array of exactly 3 plausible but WRONG definitions that could trick an advanced student). Make the distractors extremely convincing — they should be definitions of other advanced words, not obviously wrong.`,
            },
          ],
        },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                word: { type: "STRING" },
                phonetic: { type: "STRING" },
                partOfSpeech: { type: "STRING" },
                definition: { type: "STRING" },
                exampleSentence: { type: "STRING" },
                synonyms: { type: "ARRAY", items: { type: "STRING" } },
                distractors: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: [
                "word",
                "phonetic",
                "partOfSpeech",
                "definition",
                "exampleSentence",
                "synonyms",
                "distractors",
              ],
            },
          },
        },
      };

      let res;
      try {
        res = await callGeminiWithFallback({
          model: "gemini-2.5-flash",
          payload,
          apiKey,
        });
      } catch (err: any) {
        console.error("Gemini Vocabulary API error:", err.message);
        throw new Error("Failed to generate vocabulary words");
      }

      const json = await res.json();
      const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        const generatedWords = JSON.parse(content);

        // Cache in Supabase
        for (const w of generatedWords) {
          await supabaseAdmin.from("vocabulary_words").upsert(
            {
              word: w.word.toLowerCase(),
              phonetic: w.phonetic,
              part_of_speech: w.partOfSpeech,
              definition: w.definition,
              example_sentence: w.exampleSentence,
              synonyms: w.synonyms,
              distractors: w.distractors,
              exam,
              cefr_level: cefrLevel,
            },
            { onConflict: "word,exam" },
          );
        }

        // Re-fetch the generated words from DB to get their UUIDs
        const { data: freshWords } = await supabaseAdmin
          .from("vocabulary_words")
          .select("*")
          .eq("exam", exam)
          .eq("cefr_level", cefrLevel)
          .in(
            "word",
            generatedWords.map((w: any) => w.word.toLowerCase()),
          );

        if (freshWords) {
          const freshUnseen = freshWords.filter((w) => !seenWordIds.has(w.id));
          freshUnseen.sort(() => Math.random() - 0.5);
          const remainingNeeded = neededNewWordsCount - newWords.length;
          newWords = [...newWords, ...freshUnseen.slice(0, remainingNeeded)];
        }
      }
    }

    // 4. Combine review words and new words, then shuffle
    const finalWords = [...reviewWords, ...newWords];
    finalWords.sort(() => Math.random() - 0.5);

    // Fallback: if we still don't have enough (e.g. generation failed), grab random from cache
    if (finalWords.length < count && cached) {
      const remainingNeeded = count - finalWords.length;
      const alreadyInList = new Set(finalWords.map((w) => w.id));
      const fallback = cached.filter((w) => !alreadyInList.has(w.id));
      fallback.sort(() => Math.random() - 0.5);
      finalWords.push(...fallback.slice(0, remainingNeeded));
    }

    return finalWords;
  },
);

// ---------------------------------------------------------------------------
// Brainstorm Game: Validate a word and return its CEFR level
// ---------------------------------------------------------------------------
export const validateWord = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { word: string } }) => {
    const { word } = data;
    const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
    if (!apiKey) throw new Error("AI is not configured");

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Check if "${word.toLowerCase()}" is a valid, recognized English word. If it is NOT a valid English word or is just random letters, return {"valid": false, "level": "A1"}. If it IS a valid English word, determine its CEFR level (A1, A2, B1, B2, C1, C2) and return {"valid": true, "level": "LEVEL"}.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            valid: { type: "BOOLEAN" },
            level: { type: "STRING" },
          },
          required: ["valid", "level"],
        },
      },
    };

    try {
      let res;
      try {
        res = await callGeminiWithFallback({
          model: "gemini-2.5-flash",
          payload,
          apiKey,
        });
      } catch (err: any) {
        console.error("Gemini Validation API error:", err.message);
        if (err.message.includes("429")) {
          return { valid: false, level: "A1", error: "rate_limit" };
        }
        return { valid: false, level: "A1", error: "api_error" };
      }

      const json = await res.json();
      let content = json.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("Raw Gemini Validation Response:", content);

      if (!content) return { valid: false, level: "A1" };

      // Strip markdown code blocks if the LLM includes them
      content = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const result = JSON.parse(content);
      console.log("Parsed Result:", result);

      // Ensure boolean comparison in case the model returns string "true"/"false"
      const isValid = result.valid === true || result.valid === "true";

      return { valid: isValid, level: result.level || "A1" };
    } catch (err) {
      console.error("Word validation error:", err);
      return { valid: false, level: "A1" };
    }
  },
);

// ---------------------------------------------------------------------------
// Brainstorm Game: Offline Validation (No API limits)
// ---------------------------------------------------------------------------
export const validateWordOffline = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { word: string } }) => {
    const { word } = data;
    const cleanWord = word.trim().toLowerCase();

    // Check if the word exists in the offline lexicon
    const isValid = EnglishLexicon.hasWord(cleanWord);

    if (!isValid) {
      return { valid: false, points: 0, level: "N/A" };
    }

    // Points based on length since we don't have CEFR levels
    let points = 2;
    let level = "Basic";
    if (cleanWord.length >= 5) {
      points = 5;
      level = "Good";
    }
    if (cleanWord.length >= 7) {
      points = 10;
      level = "Advanced";
    }
    if (cleanWord.length >= 10) {
      points = 15;
      level = "Expert";
    }

    return { valid: true, points, level };
  },
);

// ---------------------------------------------------------------------------
// Get user's vocabulary progress for a specific exam
// ---------------------------------------------------------------------------
export const getUserProgress = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { userId: string; exam: string } }) => {
    const { userId, exam } = data;

    const { data: progress, error } = await supabaseAdmin
      .from("vocabulary_progress")
      .select("*, vocabulary_words(*)")
      .eq("user_id", userId)
      .eq("exam", exam)
      .order("next_review", { ascending: true });

    if (error) {
      console.error("Error fetching progress:", error);
      throw new Error("Failed to fetch progress");
    }

    return progress || [];
  },
);

// ---------------------------------------------------------------------------
// Update a word's progress using SM-2 spaced repetition
// ---------------------------------------------------------------------------
export const updateWordProgress = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { userId: string; wordId: string; exam: string; correct: boolean };
  }) => {
    const { userId, wordId, exam, correct } = data;

    // Fetch existing progress
    const { data: existing } = await supabaseAdmin
      .from("vocabulary_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("word_id", wordId)
      .eq("exam", exam)
      .single();

    const now = new Date().toISOString();

    if (!existing) {
      // First time seeing this word
      const interval = correct ? 1 : 0;
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + interval);

      await supabaseAdmin.from("vocabulary_progress").insert({
        user_id: userId,
        word_id: wordId,
        exam,
        times_correct: correct ? 1 : 0,
        times_incorrect: correct ? 0 : 1,
        ease_factor: correct ? 2.6 : 2.1,
        interval_days: interval,
        next_review: nextReview.toISOString(),
        last_reviewed: now,
        mastered: false,
      });
      return;
    }

    // SM-2 algorithm
    let { ease_factor, interval_days, times_correct, times_incorrect } = existing;

    if (correct) {
      times_correct += 1;
      if (interval_days === 0) {
        interval_days = 1;
      } else if (interval_days === 1) {
        interval_days = 3;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }
      ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02)));
    } else {
      times_incorrect += 1;
      interval_days = 0;
      ease_factor = Math.max(1.3, ease_factor - 0.2);
    }

    const mastered = interval_days >= 30;
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval_days);

    await supabaseAdmin
      .from("vocabulary_progress")
      .update({
        times_correct,
        times_incorrect,
        ease_factor,
        interval_days,
        next_review: nextReview.toISOString(),
        last_reviewed: now,
        mastered,
      })
      .eq("id", existing.id);
  },
);

// ---------------------------------------------------------------------------
// Get aggregated user stats
// ---------------------------------------------------------------------------
export const getUserStats = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { userId: string } }) => {
    const { userId } = data;

    const { data: allProgress } = await supabaseAdmin
      .from("vocabulary_progress")
      .select("*")
      .eq("user_id", userId);

    const progress = allProgress || [];

    const totalWords = progress.length;
    const masteredWords = progress.filter((p) => p.mastered).length;

    // Calculate streak: consecutive days with at least one review
    const reviewDates = progress
      .filter((p) => p.last_reviewed)
      .map((p) => new Date(p.last_reviewed!).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < reviewDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (reviewDates[i] === expected.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    // Words learned today
    const todayStr = new Date().toDateString();
    const learnedToday = progress.filter(
      (p) => p.last_reviewed && new Date(p.last_reviewed).toDateString() === todayStr,
    ).length;

    // Per-exam breakdown
    const exams = ["ielts", "toefl", "toeic"];
    const perExam = exams.reduce(
      (acc, exam) => {
        const examProgress = progress.filter((p) => p.exam === exam);
        acc[exam] = {
          total: examProgress.length,
          mastered: examProgress.filter((p) => p.mastered).length,
        };
        return acc;
      },
      {} as Record<string, { total: number; mastered: number }>,
    );

    return {
      totalWords,
      masteredWords,
      streak,
      learnedToday,
      perExam,
    };
  },
);

// ---------------------------------------------------------------------------
// Generate exam-specific popular writing phrases via Gemini and cache in Supabase
// Uses part_of_speech = 'phrase' to distinguish from regular words
// ---------------------------------------------------------------------------
export const getWritingPhrases = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { exam: string; cefrLevel: string; count?: number; userId?: string };
  }) => {
    const { exam, cefrLevel, count = 10, userId } = data;
    const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
    if (!apiKey) throw new Error("AI is not configured");

    let reviewWords: any[] = [];
    const seenWordIds = new Set<string>();

    if (userId) {
      // 1. Get user progress to find due review phrases
      const { data: progress } = await supabaseAdmin
        .from("vocabulary_progress")
        .select("word_id, next_review, vocabulary_words(*)")
        .eq("user_id", userId)
        .eq("exam", exam);

      if (progress) {
        // Filter to only include phrases (where part_of_speech is 'phrase')
        const phraseProgress = progress.filter(
          (p: any) => p.vocabulary_words?.part_of_speech === "phrase",
        );

        phraseProgress.forEach((p: any) => seenWordIds.add(p.word_id));
        const now = new Date().toISOString();
        const due = phraseProgress.filter((p: any) => p.next_review <= now);

        // Shuffle due phrases
        due.sort(() => Math.random() - 0.5);
        const reviewCount = Math.min(Math.floor(count / 2), due.length);
        reviewWords = due.slice(0, reviewCount).map((p: any) => p.vocabulary_words);
      }
    }

    const neededNewWordsCount = count - reviewWords.length;
    let newWords: any[] = [];

    // 2. Fetch cache to find unseen phrases
    const { data: cached } = await supabaseAdmin
      .from("vocabulary_words")
      .select("*")
      .eq("exam", exam)
      .eq("part_of_speech", "phrase");

    const unseenCached = (cached || []).filter((w) => !seenWordIds.has(w.id));
    unseenCached.sort(() => Math.random() - 0.5);

    newWords = unseenCached.slice(0, neededNewWordsCount);

    // 3. Generate more phrases via Gemini if we don't have enough
    if (newWords.length < neededNewWordsCount) {
      const generateCount = Math.max(10, neededNewWordsCount - newWords.length);
      const existingWords = (cached || []).map((w) => w.word).join(", ");

      const examLabels: Record<string, string> = {
        ielts: "IELTS academic writing",
        toefl: "TOEFL iBT academic writing",
        toeic: "TOEIC business writing",
      };

      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Generate ${generateCount} highly useful English writing phrases, idioms, collocations, or transitional phrases at CEFR level ${cefrLevel} that are popular and critical for ${examLabels[exam] || exam}. Use today's date "${new Date().toISOString().split("T")[0]}" and a random factor "${Math.random().toString(36).slice(2)}" as seeds so each request produces different phrases. Do NOT repeat any of these phrases: [${existingWords}].`,
              },
            ],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: `You are an expert English writing tutor specializing in ${examLabels[exam] || exam} preparation. Return a JSON array of ${generateCount} phrase objects. Each object must have: "word" (the phrase itself as a string), "phonetic" (empty string), "partOfSpeech" (MUST be exactly the string "phrase"), "definition" (string, the exact meaning of the phrase in context), "exampleSentence" (string, a sophisticated academic or professional sentence using the phrase), "synonyms" (array of 1-2 alternative phrases or strings), "distractors" (array of exactly 3 plausible but WRONG definitions that could trick a student). Make the distractors extremely convincing.`,
            },
          ],
        },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                word: { type: "STRING" },
                phonetic: { type: "STRING" },
                partOfSpeech: { type: "STRING" },
                definition: { type: "STRING" },
                exampleSentence: { type: "STRING" },
                synonyms: { type: "ARRAY", items: { type: "STRING" } },
                distractors: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: [
                "word",
                "phonetic",
                "partOfSpeech",
                "definition",
                "exampleSentence",
                "synonyms",
                "distractors",
              ],
            },
          },
        },
      };

      try {
        const res = await callGeminiWithFallback({
          model: "gemini-2.5-flash",
          payload,
          apiKey,
        });

        if (res.ok) {
          const json = await res.json();
          const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            const generatedWords = JSON.parse(content);

            // Cache in Supabase
            for (const w of generatedWords) {
              await supabaseAdmin.from("vocabulary_words").upsert(
                {
                  word: w.word.toLowerCase(),
                  phonetic: w.phonetic || null,
                  part_of_speech: "phrase",
                  definition: w.definition,
                  example_sentence: w.exampleSentence,
                  synonyms: w.synonyms,
                  distractors: w.distractors,
                  exam,
                  cefr_level: cefrLevel,
                },
                { onConflict: "word,exam" },
              );
            }

            // Re-fetch the generated phrases from DB to get their UUIDs
            const { data: freshWords } = await supabaseAdmin
              .from("vocabulary_words")
              .select("*")
              .eq("exam", exam)
              .eq("part_of_speech", "phrase")
              .in(
                "word",
                generatedWords.map((w: any) => w.word.toLowerCase()),
              );

            if (freshWords) {
              const freshUnseen = freshWords.filter((w) => !seenWordIds.has(w.id));
              freshUnseen.sort(() => Math.random() - 0.5);
              const remainingNeeded = neededNewWordsCount - newWords.length;
              newWords = [...newWords, ...freshUnseen.slice(0, remainingNeeded)];
            }
          }
        } else {
          console.error("Gemini Phrase API error:", res.status, await res.text());
        }
      } catch (err) {
        console.error("Error generating phrases:", err);
      }
    }

    // 4. Combine review phrases and new phrases, then shuffle
    const finalWords = [...reviewWords, ...newWords];
    finalWords.sort(() => Math.random() - 0.5);

    // Fallback: if we still don't have enough (e.g. generation failed), grab random from cache
    if (finalWords.length < count && cached) {
      const remainingNeeded = count - finalWords.length;
      const alreadyInList = new Set(finalWords.map((w) => w.id));
      const fallback = cached.filter((w) => !alreadyInList.has(w.id));
      fallback.sort(() => Math.random() - 0.5);
      finalWords.push(...fallback.slice(0, remainingNeeded));
    }

    return finalWords;
  },
);
