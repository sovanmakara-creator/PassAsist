import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Fetches dynamic dashboard statistics from the evaluations table.
 *
 * - Computes the latest band score for Writing and Speaking skills
 * - Listening and Reading always return null (no evaluation system exists for them yet)
 * - Computes a weekly streak based on distinct dates with evaluations this week (Mon–Sun)
 */
export const getDashboardStats = createServerFn({ method: "GET" }).handler(async () => {
  // ── Skill Scores ──────────────────────────────────────────────
  // Fetch the most recent evaluation for each skill category

  let writingScore: number | null = null;
  let speakingScore: number | null = null;

  try {
    // Writing: exam values are ielts_task1, ielts_task2, toefl, toeic
    const { data: writingEvals } = await supabaseAdmin
      .from("evaluations")
      .select("exam, feedback")
      .or("exam.eq.ielts_task1,exam.eq.ielts_task2,exam.eq.toefl,exam.eq.toeic")
      .order("created_at", { ascending: false })
      .limit(1);

    if (writingEvals && writingEvals.length > 0) {
      const fb = writingEvals[0].feedback as Record<string, unknown>;
      const bandScore = typeof fb?.band_score === "number" ? fb.band_score : null;
      const examType = writingEvals[0].exam;

      if (bandScore !== null) {
        // Normalize to 0-100 percentage based on exam scale
        if (examType === "ielts_task1" || examType === "ielts_task2") {
          // IELTS: 0-9 scale
          writingScore = Math.round((bandScore / 9) * 100);
        } else if (examType === "toefl") {
          // TOEFL: 0-30 scale
          writingScore = Math.round((bandScore / 30) * 100);
        } else if (examType === "toeic") {
          // TOEIC: 0-200 scale
          writingScore = Math.round((bandScore / 200) * 100);
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch writing evaluations:", e);
  }

  try {
    // Speaking: exam values are ielts_speaking, toefl_speaking, toeic_speaking
    const { data: speakingEvals } = await supabaseAdmin
      .from("evaluations")
      .select("exam, feedback")
      .or("exam.eq.ielts_speaking,exam.eq.toefl_speaking,exam.eq.toeic_speaking")
      .order("created_at", { ascending: false })
      .limit(1);

    if (speakingEvals && speakingEvals.length > 0) {
      const fb = speakingEvals[0].feedback as Record<string, unknown>;
      const bandScore = typeof fb?.band_score === "number" ? fb.band_score : null;
      const examType = speakingEvals[0].exam;

      if (bandScore !== null) {
        if (examType === "ielts_speaking") {
          // IELTS: 0-9 scale
          speakingScore = Math.round((bandScore / 9) * 100);
        } else if (examType === "toefl_speaking") {
          // TOEFL: 0-30 scale
          speakingScore = Math.round((bandScore / 30) * 100);
        } else if (examType === "toeic_speaking") {
          // TOEIC: 0-200 scale
          speakingScore = Math.round((bandScore / 200) * 100);
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch speaking evaluations:", e);
  }

  // ── Weekly Streak ─────────────────────────────────────────────
  // Determine which days this week (Mon–Sun) have at least one evaluation

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...6=Sat
  // Calculate Monday of the current week
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const streakDays = [false, false, false, false, false, false, false]; // Mon–Sun

  try {
    const { data: weekEvals } = await supabaseAdmin
      .from("evaluations")
      .select("created_at")
      .gte("created_at", monday.toISOString())
      .lte("created_at", sunday.toISOString());

    if (weekEvals && weekEvals.length > 0) {
      for (const ev of weekEvals) {
        const d = new Date(ev.created_at);
        const dow = d.getDay(); // 0=Sun ... 6=Sat
        // Map to Mon=0 ... Sun=6
        const idx = dow === 0 ? 6 : dow - 1;
        streakDays[idx] = true;
      }
    }
  } catch (e) {
    console.error("Failed to fetch weekly streak data:", e);
  }

  const streakCount = streakDays.filter(Boolean).length;

  return {
    skills: {
      listening: null as number | null,
      reading: null as number | null,
      writing: writingScore,
      speaking: speakingScore,
    },
    streak: {
      count: streakCount,
      days: streakDays,
    },
  };
});
