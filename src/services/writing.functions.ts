import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGeminiWithFallback } from "./gemini-helper";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import * as cheerio from "cheerio";
import { TOEFL_TOPICS, TOEIC_TOPICS, pickRandom } from "./topic-bank";

const InputSchema = z.object({
  exam: z.enum(["ielts_task1", "ielts_task2", "toefl", "toeic"]),
  task: z.string().min(1).max(3000),
  essay: z.string().min(20).max(8000),
});

const FeedbackSchema = {
  type: "object",
  properties: {
    band_score: {
      type: "number",
      description:
        "Estimated band score (0-9 for IELTS, 0-30 for TOEFL writing, 0-200 for TOEIC writing)",
    },
    overall: { type: "string", description: "2-3 sentence overall summary" },
    strengths: { type: "array", items: { type: "string" }, description: "3-5 concrete strengths" },
    improvements: {
      type: "array",
      items: { type: "string" },
      description: "3-5 actionable improvements",
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
        required: ["original", "correction", "explanation"],
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
        required: ["word", "better", "why"],
      },
    },

    coherence: { type: "string", description: "Coherence & cohesion analysis" },
    criteria_scores: {
      type: "object",
      properties: {
        task_achievement: {
          type: "object",
          properties: {
            score: {
              type: "number",
              description:
                "Score from 1 to 5. Be critical: 5 is only for fully addressed prompts of the correct length. Reduce the score if parts of the prompt are ignored or if it is too short.",
            },
            comment: { type: "string", description: "1-2 sentence justification for the score." },
          },
          required: ["score", "comment"],
        },
        coherence_cohesion: {
          type: "object",
          properties: {
            score: {
              type: "number",
              description:
                "Score from 1 to 5. Be critical: 5 is only for perfectly organized essays with clear paragraphs and smooth transitions. Reduce the score for poor paragraph structuring or awkward/missing transitions.",
            },
            comment: { type: "string", description: "1-2 sentence justification for the score." },
          },
          required: ["score", "comment"],
        },
        lexical_resource: {
          type: "object",
          properties: {
            score: {
              type: "number",
              description:
                "Score from 1 to 5. Be critical: 5 requires advanced, precise vocabulary with zero errors. Reduce the score if there are vocabulary/spelling errors, repetitive words, or basic vocabulary.",
            },
            comment: { type: "string", description: "1-2 sentence justification for the score." },
          },
          required: ["score", "comment"],
        },
        grammatical_range: {
          type: "object",
          properties: {
            score: {
              type: "number",
              description:
                "Score from 1 to 5. Be critical: 5 requires error-free complex sentences. If there are ANY grammar issues listed in grammar_issues, this score MUST be 4 or lower.",
            },
            comment: { type: "string", description: "1-2 sentence justification for the score." },
          },
          required: ["score", "comment"],
        },
      },
      required: ["task_achievement", "coherence_cohesion", "lexical_resource", "grammatical_range"],
      description: "Four IELTS assessment criteria, each scored 1-5",
    },
  },
  required: [
    "band_score",
    "overall",
    "strengths",
    "improvements",
    "grammar_issues",
    "vocabulary_suggestions",
    "coherence",
    "criteria_scores",
  ],
} as const;

export const analyzeWriting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
    console.log("Loaded API Key length:", apiKey?.length);
    if (!apiKey) throw new Error("AI is not configured");

    const examLabel =
      data.exam === "ielts_task1"
        ? "IELTS Academic Writing Task 1 (band 0-9)"
        : data.exam === "ielts_task2"
          ? "IELTS Writing Task 2 (band 0-9)"
          : data.exam === "toefl"
            ? "TOEFL iBT writing (0-30)"
            : "TOEIC writing (0-200)";

    const payload = {
      model: "gemini-flash-latest",
      messages: [
        {
          role: "system",
          content: `You are an expert English exam writing examiner. Evaluate essays strictly but fairly.
You must grade the criteria scores (task_achievement, coherence_cohesion, lexical_resource, grammatical_range) strictly on a scale of 1 to 5, where:
- 5: Perfect/Near-perfect. No errors, highly advanced sentence structures, cohesive and fully addressed prompt.
- 4: Very Good. Minimal minor errors that do not impede communication, good cohesion and vocabulary.
- 3: Satisfactory. Noticeable grammar/vocabulary errors, basic sentence structures, or slightly incomplete response.
- 2: Poor. Frequent errors that obscure meaning, very simple or repetitive language, or poorly addressed prompt.
- 1: Extremely Poor. Barely comprehensible, major grammatical failures, or off-topic.

CRITICAL GRADING RULES:
1. If there are ANY grammatical errors or typos listed in 'grammar_issues', the score for 'grammatical_range' MUST be downgraded (maximum 4/5, or lower if multiple errors exist).
2. If there are vocabulary suggestions or repetitive words listed in 'vocabulary_suggestions', the score for 'lexical_resource' MUST be downgraded (maximum 4/5, or lower if vocabulary is very basic).
3. If the essay does not meet the word count requirements or fails to address parts of the prompt, 'task_achievement' MUST be downgraded (e.g., 3/5 or lower).
4. Do not default to 5/5. Be critical. Most essays should receive a 3 or 4 if they have errors.
Always return structured JSON via the provided tool.`,
        },
        {
          role: "user",
          content: `Exam: ${examLabel}\n\nTask prompt:\n${data.task}\n\nCandidate response:\n${data.essay}\n\nGive a complete examiner-style evaluation. Use the band scale appropriate for ${examLabel}.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_feedback",
            description: "Submit structured writing feedback",
            parameters: FeedbackSchema,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit_feedback" } },
    };

    let res;
    try {
      res = await callGeminiWithFallback({
        model: "gemini-flash-latest",
        payload,
        apiKey,
        isOpenAI: true,
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
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("AI returned no feedback");
    const feedback = JSON.parse(call.function.arguments);

    try {
      await supabaseAdmin.from("evaluations").insert({
        exam: data.exam,
        task: data.task,
        essay: data.essay,
        feedback: feedback as any,
      });
    } catch (e) {
      console.error("Failed to save evaluation to Supabase:", e);
    }

    return feedback as {
      band_score: number;
      overall: string;
      strengths: string[];
      improvements: string[];
      grammar_issues: { original: string; correction: string; explanation: string }[];
      vocabulary_suggestions: { word: string; better: string; why: string }[];

      coherence: string;
      criteria_scores: {
        task_achievement: { score: number; comment: string };
        coherence_cohesion: { score: number; comment: string };
        lexical_resource: { score: number; comment: string };
        grammatical_range: { score: number; comment: string };
      };
    };
  });

const FetchTopicSchema = z.object({
  exam: z.enum(["ielts_task1", "ielts_task2", "toefl", "toeic"]),
  writingType: z.string().optional(),
});

export const fetchNewTopic = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FetchTopicSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();

    try {
      let taskText = "";
      let imageUrl = "";
      let questionForVocab = "";      const examName = data.exam === "toefl" ? "toefl_writing" : data.exam === "toeic" ? "toeic_writing" : data.exam;
      const sectionName = data.writingType || (data.exam === "toefl" ? "independent" : data.exam === "toeic" ? "opinion_essay" : "task1");

      let dbTopics: { prompt_text: string; image_url: string | null }[] = [];
      try {
        const { data: dbRes, error } = await supabaseAdmin
          .from("topics")
          .select("prompt_text, image_url")
          .eq("exam", examName)
          .eq("part", sectionName);
        if (!error && dbRes && dbRes.length > 0) {
          dbTopics = dbRes;
        }
      } catch (e) {
        console.error("DB writing topics fetch failed:", e);
      }

      if (dbTopics.length > 0) {
        const selected = pickRandom(dbTopics);
        questionForVocab = selected.prompt_text;
        imageUrl = selected.image_url || "";

        if (data.exam === "ielts_task1") {
          taskText =
            "You should spend about 20 minutes on this task.\n\n" +
            selected.prompt_text +
            "\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.";
        } else if (data.exam === "ielts_task2") {
          taskText =
            "You should spend about 40 minutes on this task.\n\nWrite about the following topic:\n\n" +
            selected.prompt_text +
            "\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.";
        } else if (data.exam === "toefl") {
          taskText =
            "You have 30 minutes to complete this task.\n\n" +
            selected.prompt_text +
            "\n\nUse specific reasons and examples to support your answer. Write at least 300 words.";
        } else {
          taskText =
            "You have 30 minutes to complete this task.\n\n" +
            selected.prompt_text +
            "\n\nWrite at least 300 words.";
        }
      } else {
        if (data.exam === "ielts_task1" || data.exam === "ielts_task2") {
          // ---- IELTS: scrape from ielts-writing.info ----
          const baseUrl =
            data.exam === "ielts_task1"
              ? "https://www.ielts-writing.info/EXAM/academic_writing_samples_task_1/"
              : "https://www.ielts-writing.info/EXAM/ielts_writing_samples_task_2/";

          const listRes = await fetch(baseUrl);
          const listHtml = await listRes.text();
          const $list = cheerio.load(listHtml);

          let allLinks: string[] = [];
          $list("a.alink").each((_, el) => {
            const href = $list(el).attr("href");
            if (href)
              allLinks.push(href.startsWith("http") ? href : `https://www.ielts-writing.info${href}`);
          });

          if (allLinks.length === 0)
            throw new Error("Could not find any topics on the source website.");

          // Shuffle and pick up to 15 links to check in parallel for the correct category
          allLinks = allLinks.sort(() => 0.5 - Math.random()).slice(0, 15);

          const fetchPromises = allLinks.map(async (link) => {
            try {
              const taskRes = await fetch(link);
              const $task = cheerio.load(await taskRes.text());

              let imgUrl = "";
              if (data.exam === "ielts_task1") {
                const imgEl = $task("img")
                  .filter((_, el) => {
                    const src = $task(el).attr("src");
                    return !!src && (src.includes("graphs") || src.includes("IELTS-Writing-Samples"));
                  })
                  .first();
                if (imgEl.length > 0) {
                  const extractedSrc = imgEl.attr("src");
                  imgUrl = extractedSrc ? String(extractedSrc) : "";
                  if (imgUrl && !imgUrl.startsWith("http"))
                    imgUrl = `https://www.ielts-writing.info${imgUrl}`;
                }
              }

              const questionParts: string[] = [];
              $task("article div.qbox")
                .find("p")
                .each((_, p) => {
                  const pText = $task(p).text().trim();
                  if (
                    pText.length > 10 &&
                    !pText.includes("Summarise the information") &&
                    !pText.includes("Write about the following") &&
                    !pText.includes("Give reasons for your answer")
                  ) {
                    questionParts.push(String(pText));
                  }
                });
              const rawQuestion = questionParts.join(" ");
              const qText = rawQuestion.toLowerCase();

              let matches = false;
              if (!data.writingType) matches = true;
              else {
                const reqType = data.writingType.toLowerCase();
                if (data.exam === "ielts_task1") {
                  if (reqType === "bar_chart" && qText.includes("bar")) matches = true;
                  else if (reqType === "line_graph" && qText.includes("line")) matches = true;
                  else if (reqType === "pie_chart" && qText.includes("pie")) matches = true;
                  else if (reqType === "table" && qText.includes("table")) matches = true;
                  else if (reqType === "map" && (qText.includes("map") || qText.includes("plan")))
                    matches = true;
                  else if (
                    reqType === "process" &&
                    (qText.includes("process") || qText.includes("diagram") || qText.includes("flow"))
                  )
                    matches = true;
                } else {
                  if (
                    reqType === "opinion" &&
                    (qText.includes("agree") ||
                      qText.includes("disagree") ||
                      qText.includes("opinion") ||
                      qText.includes("do you think"))
                  )
                    matches = true;
                  else if (
                    reqType === "discussion" &&
                    (qText.includes("discuss both") || qText.includes("discuss these"))
                  )
                    matches = true;
                  else if (
                    reqType === "problem_solution" &&
                    (qText.includes("problem") ||
                      qText.includes("solution") ||
                      qText.includes("cause") ||
                      qText.includes("solve"))
                  )
                    matches = true;
                  else if (
                    reqType === "advantages" &&
                    (qText.includes("advantage") ||
                      qText.includes("disadvantage") ||
                      qText.includes("outweigh"))
                  )
                    matches = true;
                  else if (reqType === "two_part" && qText.split("?").length > 2) matches = true;
                }
              }

              return { rawQuestion, imgUrl, matches };
            } catch (e) {
              return null;
            }
          });

          const results = await Promise.all(fetchPromises);
          const validResults = results.filter((r) => r !== null);
          if (validResults.length === 0) throw new Error("Failed to load topics from source.");

          // Find a matching category, or fallback to the first valid one
          const match = validResults.find((r) => r.matches) || validResults[0];

          imageUrl = match.imgUrl;
          questionForVocab = match.rawQuestion;

          if (data.exam === "ielts_task1") {
            taskText =
              "You should spend about 20 minutes on this task.\n\n" +
              match.rawQuestion +
              "\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.";
          } else {
            taskText =
              "You should spend about 40 minutes on this task.\n\nWrite about the following topic:\n\n" +
              match.rawQuestion +
              "\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.";
          }
        } else if (data.exam === "toefl") {
          // ---- TOEFL: curated real topic bank from ETS & prep sources ----
          const type = data.writingType ?? "independent";
          const topics = TOEFL_TOPICS[type] ?? TOEFL_TOPICS.independent;
          const question = pickRandom(topics);
          questionForVocab = question;
          taskText =
            "You have 30 minutes to complete this task.\n\n" +
            question +
            "\n\nUse specific reasons and examples to support your answer. Write at least 300 words.";
        } else {
          // ---- TOEIC: curated real topic bank from ETS & prep sources ----
          const type = data.writingType ?? "opinion_essay";
          const topics = TOEIC_TOPICS[type] ?? TOEIC_TOPICS.opinion_essay;
          const question = pickRandom(topics);
          questionForVocab = question;
          taskText =
            "You have 30 minutes to complete this task.\n\n" +
            question +
            "\n\nWrite at least 300 words.";
        }
      }

      // Generate vocab using Gemini (only AI usage — never for topic generation)
      let recommendedWords: { word: string; hint: string }[] = [];
      try {
        if (apiKey && questionForVocab) {
          const vocabPayload = {
            model: "gemini-flash-latest",
            messages: [
              {
                role: "system",
                content:
                  "You must return ONLY a raw JSON array of 15 objects with 'word' and 'hint' string properties. Provide highly practical, frequently used words that are extremely useful for writing an essay on this specific topic. Mix: 5 essential topic-specific vocabulary words, 5 natural linking phrases, and 5 common academic collocations. Avoid overly advanced, obscure, or rarely used words. Do NOT use markdown code blocks like ```json.",
              },
              { role: "user", content: `Topic: ${questionForVocab}` },
            ],
          };

          let vRes;
          try {
            vRes = await callGeminiWithFallback({
              model: "gemini-flash-latest",
              payload: vocabPayload,
              apiKey,
              isOpenAI: true,
            });
          } catch (err: any) {
            console.error("Vocab generation Gemini call failed:", err.message);
          }

          if (vRes && vRes.ok) {
            const vocabData = await vRes.json();
            const vc = vocabData.choices?.[0]?.message?.content ?? "";

            // Clean up any potential markdown formatting if model still adds it
            const cleanedJson = vc
              .replace(/```json/gi, "")
              .replace(/```/g, "")
              .trim();
            recommendedWords = JSON.parse(cleanedJson);

            if (!Array.isArray(recommendedWords)) {
              console.warn("Gemini did not return an array for vocab:", recommendedWords);
              recommendedWords = [];
            }
          } else {
            console.warn(
              "Gemini vocab generation failed with status:",
              vRes?.status,
              await vRes?.text(),
            );
          }
        }
      } catch (e) {
        console.error("Vocab gen failed:", e);
      }

      return {
        task: String(taskText.trim()),
        imageUrl: imageUrl ? String(imageUrl) : null,
        recommendedWords,
      };
    } catch (e) {
      console.error("Error fetching new topic:", e);
      throw new Error("Failed to fetch a new topic. Please try again.");
    }
  });
