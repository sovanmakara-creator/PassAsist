import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGeminiWithFallback } from "./gemini-helper";

const DictionaryDefinitionSchema = z.object({
  word: z.string(),
  contextSentence: z.string(),
});

const QuestionClueSchema = z.object({
  context: z.string(),
  question: z.string(),
});

const AnswerExplanationSchema = z.object({
  context: z.string(),
  question: z.string(),
  correctAnswer: z.string(),
  userAnswer: z.string(),
});

const AdminAiHelperSchema = z.object({
  prompt: z.string(),
  context: z.string().optional(),
});

export const getGeminiLiveToken = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from environment variables.");
  }
  return { apiKey };
});

export const getWordOfTheDay = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
  if (!apiKey) throw new Error("AI is not configured");

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Generate one C1/C2 vocabulary word useful for English proficiency exams (IELTS/TOEFL/TOEIC). Use this date string as a random seed to ensure a different word is selected each day: ${new Date().toISOString().split("T")[0]}. Pick a completely random word based on this seed.`,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [
        {
          text: "You are an expert English tutor. Return a JSON object with 'word' (string, advanced vocab), 'phonetic' (string, phonetic spelling), 'partOfSpeech' (string), 'definition' (string), 'example' (string). Do not include markdown formatting.",
        },
      ],
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          word: { type: "string" },
          phonetic: { type: "string" },
          partOfSpeech: { type: "string" },
          definition: { type: "string" },
          example: { type: "string" },
        },
        required: ["word", "phonetic", "partOfSpeech", "definition", "example"],
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
  } catch (err) {
    console.error("Gemini Word of the Day API error:", err);
    throw new Error("Failed to generate word");
  }

  const json = await res.json();
  const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Failed to generate word content");
  return JSON.parse(content) as {
    word: string;
    phonetic: string;
    partOfSpeech: string;
    definition: string;
    example: string;
  };
});

export const getDailyMiniTest = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
  if (!apiKey) throw new Error("AI is not configured");

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Generate a daily mini-test of 5 multiple-choice questions focusing on C1/C2 advanced English grammar/vocabulary.",
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [
        {
          text: "You are an expert English test creator. Generate a mini-test of 5 multiple-choice questions focusing on advanced English grammar and vocabulary (C1/C2 level) suitable for IELTS, TOEFL, or TOEIC. Return a JSON array of 5 objects, where each object has: 'question' (string), 'options' (array of 4 strings), 'correctIndex' (number, 0-3), and 'explanation' (string, 1 sentence explaining why it's correct).",
        },
      ],
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: {
              type: "array",
              items: { type: "string" },
            },
            correctIndex: { type: "integer" },
            explanation: { type: "string" },
          },
          required: ["question", "options", "correctIndex", "explanation"],
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
  } catch (err) {
    console.error("Gemini Daily Mini-Test API error:", err);
    throw new Error("Failed to generate test");
  }

  const json = await res.json();
  const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Failed to generate test content");
  return JSON.parse(content) as {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
});

export const getDictionaryDefinition = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DictionaryDefinitionSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
    if (!apiKey) throw new Error("AI is not configured");

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Define the word "${data.word}" as it is used in this context: "${data.contextSentence}"`,
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: "You are an expert English dictionary. Return a JSON object with 'word' (string, the base form of the word), 'phonetic' (string, phonetic spelling), 'partOfSpeech' (string, based on context), 'definition' (string, specific to the context provided), 'example' (string, an example sentence similar to the context). Do not include markdown formatting.",
          },
        ],
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            word: { type: "string" },
            phonetic: { type: "string" },
            partOfSpeech: { type: "string" },
            definition: { type: "string" },
            example: { type: "string" },
          },
          required: ["word", "phonetic", "partOfSpeech", "definition", "example"],
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
    } catch (err) {
      console.error("Gemini Dictionary API error:", err);
      throw new Error("Failed to define word");
    }

    const json = await res.json();
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Failed to parse definition");
    return JSON.parse(content) as {
      word: string;
      phonetic: string;
      partOfSpeech: string;
      definition: string;
      example: string;
    };
  },
);

export const getQuestionClue = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => QuestionClueSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
    if (!apiKey) throw new Error("AI is not configured");

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: `Context passage/info: ${data.context}` },
            { text: `Question: ${data.question}` },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: "You are an expert English tutor. The user is taking a reading or listening test and needs a hint for the provided question based on the context. Provide a short, 1-2 sentence hint that guides them towards the correct part of the context or helps them understand the question better. DO NOT give away the exact answer directly. Return a JSON object with a single 'clue' string property.",
          },
        ],
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: { clue: { type: "string" } },
          required: ["clue"],
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
    } catch (err) {
      console.error("Gemini Question Clue API error:", err);
      throw new Error("Failed to get clue");
    }

    const json = await res.json();
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Failed to parse clue");
    return JSON.parse(content) as { clue: string };
  },
);

export const getAnswerExplanation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnswerExplanationSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
    if (!apiKey) throw new Error("AI is not configured");

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: `Context passage/info: ${data.context}` },
            { text: `Question: ${data.question}` },
            { text: `Correct Answer: ${data.correctAnswer}` },
            { text: `User's Wrong Answer: ${data.userAnswer}` },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: "You are an expert English tutor. The user answered a test question incorrectly. Briefly explain WHY the correct answer is correct based on the provided context, and optionally point out why their answer was wrong. Keep it to 1-3 sentences maximum. Return a JSON object with a single 'explanation' string property.",
          },
        ],
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: { explanation: { type: "string" } },
          required: ["explanation"],
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
    } catch (err) {
      console.error("Gemini Answer Explanation API error:", err);
      throw new Error("Failed to get explanation");
    }

    const json = await res.json();
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Failed to parse explanation");
    return JSON.parse(content) as { explanation: string };
  },
);

export const getAdminAiHelper = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AdminAiHelperSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
    if (!apiKey) throw new Error("AI is not configured");

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: `User Prompt: ${data.prompt}` },
            { text: data.context ? `Optional Resource/Course Context: ${data.context}` : "" },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: "You are an expert AI Assistant designed to help course administrators manage and create learning materials for PassAssist (an English proficiency exam preparation platform for IELTS/TOEFL/TOEIC). You can help them write descriptions, outline course chapters, generate study questions, format documents, and organize resources. Be concise, practical, and highly helpful. Return a JSON object with a single 'response' string property containing your markdown-formatted response.",
          },
        ],
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: { response: { type: "string" } },
          required: ["response"],
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
    } catch (err) {
      console.error("Gemini Admin AI Helper API error:", err);
      throw new Error("Failed to call Gemini");
    }

    const json = await res.json();
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Failed to parse AI response");
    return JSON.parse(content) as { response: string };
  },
);
