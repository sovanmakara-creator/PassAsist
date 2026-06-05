import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGeminiWithFallback } from "./gemini-helper";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  IELTS_SPEAKING_TOPICS,
  TOEFL_SPEAKING_TOPICS,
  TOEIC_SPEAKING_TOPICS,
  pickRandom,
} from "./topic-bank";

const FetchSpeakingTopicSchema = z.object({
  exam: z.enum(["ielts_speaking", "toefl_speaking", "toeic_speaking"]),
  part: z.string().optional(),
  topicIndex: z.number().optional(),
});

function getDefaultPart(exam: string): string {
  if (exam === "ielts_speaking") return "part1";
  if (exam === "toefl_speaking") return "independent";
  if (exam === "toeic_speaking") return "respond_to_questions";
  return "part1";
}

export const fetchTopicList = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FetchSpeakingTopicSchema.parse(input))
  .handler(async ({ data }) => {
    let topics: string[] = [];
    let part = data.part || getDefaultPart(data.exam);

    if (part === "full_mock") {
      if (data.exam === "ielts_speaking") part = "part2";
      else if (data.exam === "toefl_speaking") part = "independent";
      else if (data.exam === "toeic_speaking") part = "express_opinion";
    }

    try {
      const { data: dbTopics, error } = await supabaseAdmin
        .from("topics")
        .select("prompt_text")
        .eq("exam", data.exam)
        .eq("part", part)
        .order("created_at", { ascending: true });

      if (!error && dbTopics && dbTopics.length > 0) {
        topics = dbTopics.map((t) => t.prompt_text);
      }
    } catch (err) {
      console.error("Failed to query speaking topics from DB:", err);
    }

    if (topics.length === 0) {
      if (data.exam === "ielts_speaking") {
        topics = IELTS_SPEAKING_TOPICS[part] || IELTS_SPEAKING_TOPICS.part1;
      } else if (data.exam === "toefl_speaking") {
        topics = TOEFL_SPEAKING_TOPICS[part] || TOEFL_SPEAKING_TOPICS.independent;
      } else if (data.exam === "toeic_speaking") {
        topics = TOEIC_SPEAKING_TOPICS[part] || TOEIC_SPEAKING_TOPICS.respond_to_questions;
      }
    }
    return { topics };
  });

export const fetchSpeakingTopic = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FetchSpeakingTopicSchema.parse(input))
  .handler(async ({ data }) => {
    let taskText = "";

    const isRandom = typeof data.topicIndex !== "number" || data.topicIndex < 0;
    let part = data.part || getDefaultPart(data.exam);
    if (part === "full_mock") {
      if (data.exam === "ielts_speaking") part = "part2";
      else if (data.exam === "toefl_speaking") part = "independent";
      else if (data.exam === "toeic_speaking") part = "express_opinion";
    }

    if (isRandom) {
      const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
      if (apiKey) {
        try {
          const prompt = `Generate a completely unique and specific speaking task prompt for the ${data.exam.replace("_", " ").toUpperCase()} exam, specifically for the "${part}" section. Output ONLY the raw text of the question/prompt without any intro, markdown or formatting. It must be varied and not a common/repeated topic.`;
          const res = await callGeminiWithFallback({
            model: "gemini-2.5-flash",
            payload: { contents: [{ role: "user", parts: [{ text: prompt }] }] },
            apiKey,
          });
          const json = await res.json();
          taskText = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        } catch (e) {
          console.error("Failed to generate dynamic topic", e);
        }
      }
    }

    if (!taskText) {
      let topics: string[] = [];

      try {
        const { data: dbTopics, error } = await supabaseAdmin
          .from("topics")
          .select("prompt_text")
          .eq("exam", data.exam)
          .eq("part", part)
          .order("created_at", { ascending: true });

        if (!error && dbTopics && dbTopics.length > 0) {
          topics = dbTopics.map((t) => t.prompt_text);
        }
      } catch (err) {
        console.error("Failed to query speaking topic from DB:", err);
      }

      if (topics.length === 0) {
        if (data.exam === "ielts_speaking") {
          topics = IELTS_SPEAKING_TOPICS[part] || IELTS_SPEAKING_TOPICS.part1;
        } else if (data.exam === "toefl_speaking") {
          topics = TOEFL_SPEAKING_TOPICS[part] || TOEFL_SPEAKING_TOPICS.independent;
        } else if (data.exam === "toeic_speaking") {
          topics = TOEIC_SPEAKING_TOPICS[part] || TOEIC_SPEAKING_TOPICS.respond_to_questions;
        }
      }

      taskText = isRandom ? pickRandom(topics) : topics[data.topicIndex!] || pickRandom(topics);
    }

    return { task: taskText, imageUrl: "" };
  });

const AnalyzeSpeakingSchema = z.object({
  exam: z.enum(["ielts_speaking", "toefl_speaking", "toeic_speaking"]),
  task: z.string().min(1),
  audioBase64: z.string().min(1),
  mimeType: z.string().min(1),
});

export const analyzeSpeaking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalyzeSpeakingSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

    let examLabel = "";
    if (data.exam.startsWith("ielts")) examLabel = "IELTS Speaking";
    if (data.exam.startsWith("toefl")) examLabel = "TOEFL Speaking";
    if (data.exam.startsWith("toeic")) examLabel = "TOEIC Speaking";

    // Clean up base64 prefix if present
    const base64Data = data.audioBase64.replace(/^data:audio\/\w+;base64,/, "");

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Exam: ${examLabel}\nTask prompt:\n${data.task}\n\nEvaluate the user's spoken response provided in the audio clip. Act as an expert examiner. Return the evaluation in the requested JSON structure. Include a transcription of what the user said in the 'transcript' field.\n\nCRITICAL: If the audio clip is silent, contains no spoken English, or consists only of noise/static, you MUST set 'band_score' to 0, 'transcript' to '[No speech detected]', and 'overall' to 'No speech detected.'`,
            },
            {
              inline_data: {
                mime_type: data.mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            band_score: {
              type: "number",
              description: "Estimated band score based on the exam's rubric",
            },
            transcript: {
              type: "string",
              description:
                "A highly accurate speech-to-text transcript of the user's audio response.",
            },
            overall: {
              type: "string",
              description: "2-3 sentence overall summary of their speaking performance.",
            },
            strengths: {
              type: "array",
              items: { type: "string" },
              description: "3-5 concrete strengths.",
            },
            improvements: {
              type: "array",
              items: { type: "string" },
              description: "3-5 actionable improvements.",
            },
            grammar_issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  original: { type: "string" },
                  correction: { type: "string" },
                  explanation: { type: "string" },
                },
              },
            },
            vocabulary_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  word: { type: "string" },
                  better: { type: "string" },
                  why: { type: "string" },
                },
              },
            },
            criteria_scores: {
              type: "object",
              properties: {
                fluency_coherence: {
                  type: "object",
                  properties: { score: { type: "number" }, comment: { type: "string" } },
                },
                lexical_resource: {
                  type: "object",
                  properties: { score: { type: "number" }, comment: { type: "string" } },
                },
                grammatical_range: {
                  type: "object",
                  properties: { score: { type: "number" }, comment: { type: "string" } },
                },
                pronunciation: {
                  type: "object",
                  properties: { score: { type: "number" }, comment: { type: "string" } },
                },
              },
            },
          },
          required: [
            "band_score",
            "transcript",
            "overall",
            "strengths",
            "improvements",
            "grammar_issues",
            "vocabulary_suggestions",
            "criteria_scores",
          ],
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
      console.error("AI gateway error:", err.message);
      if (err.message.includes("429")) {
        throw new Error(
          "The AI service is currently too busy. Please wait a few seconds and try again.",
        );
      }
      if (err.message.includes("402")) {
        throw new Error("AI credits exhausted. Add credits in Workspace → Usage.");
      }
      throw new Error("AI service error");
    }

    const json = await res.json();
    const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error("AI returned no feedback");

    let feedback;
    try {
      feedback = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON output:", responseText);
      throw new Error("Failed to parse evaluation data.");
    }

    // Check if the model detected no speech (or returned 0 score / empty transcript)
    if (
      feedback.band_score === 0 ||
      feedback.transcript?.trim() === "[No speech detected]" ||
      !feedback.transcript?.trim()
    ) {
      throw new Error(
        "No speech detected. Please speak clearly into your microphone and try again.",
      );
    }

    // Save to evaluations table using the transcript as the "essay" content
    try {
      await supabaseAdmin.from("evaluations").insert({
        exam: data.exam,
        task: data.task,
        essay: `[Audio Submission]\n\nTranscript:\n${feedback.transcript || "No transcript available."}`,
        feedback: feedback as any,
      });
    } catch (e) {
      console.error("Failed to save evaluation to Supabase:", e);
    }

    return feedback;
  });
