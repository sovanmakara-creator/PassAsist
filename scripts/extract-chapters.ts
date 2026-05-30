import fs from "fs";
import path from "path";

const API_KEY = "AIzaSyAM4oiF3bDVGBvwUZa0yNE5A1d8nlpz8gk";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// All PDFs to process
const PDF_FILES = [
  {
    file: "public/resources/helpful/1000-phrasal-verbs-with-meanings-and-sentences.pdf",
    id: "1000-phrasal-verbs",
  },
  {
    file: "public/resources/helpful/130-common-mistakes-in-english.pdf",
    id: "130-common-mistakes",
  },
  {
    file: "public/resources/helpful/49-easy-english-conversation-dialogues-for-beginners-in.pdf",
    id: "49-easy-dialogues",
  },
  {
    file: "public/resources/helpful/49-english-conversation-topics.pdf",
    id: "49-conversation-topics",
  },
  {
    file: "public/resources/helpful/500-words-phrases-idioms-for-the-toefl-cam-edu.pdf",
    id: "500-toefl-words",
  },
  {
    file: "public/resources/helpful/501-critical-reading-questions.pdf",
    id: "501-critical-reading",
  },
  {
    file: "public/resources/helpful/501-sentence-completion-questions.pdf",
    id: "501-sentence-completion",
  },
  {
    file: "public/resources/helpful/501-synonym-and-antonym-questions.pdf",
    id: "501-synonym-antonym",
  },
  {
    file: "public/resources/helpful/advanced-english-conversation-dialogues-speak-english-like.pdf",
    id: "advanced-conversation-dialogues",
  },
  {
    file: "public/resources/helpful/advanced-english-conversations-speak-english-like-a-native.pdf",
    id: "advanced-conversations-native",
  },
  {
    file: "public/resources/helpful/advanced-english-dialogues-stories-vocabulary.pdf",
    id: "advanced-dialogues-stories",
  },
  {
    file: "public/resources/helpful/collins-common-errors-in-english-and-how-to-avoid-them.pdf",
    id: "collins-common-errors",
  },
  {
    file: "public/resources/helpful/grammar-for-everyone-practical-tools-for-learning.pdf",
    id: "grammar-for-everyone",
  },
  {
    file: "public/resources/helpful/great-debates-for-esl-efl-39-important-debating-topics.pdf",
    id: "great-debates-esl",
  },
  {
    file: "public/resources/helpful/perfect-phrases-for-esl-conversational-skills.pdf",
    id: "perfect-phrases-esl",
  },
  {
    file: "public/resources/helpful/shortcut-to-english-collocations-master-2000-english.pdf",
    id: "shortcut-collocations",
  },
  { file: "public/resources/helpful/slang-informal-english.pdf", id: "slang-informal-english" },
  {
    file: "public/resources/helpful/spoken-english-in-dialogues-833-common-english-sentences.pdf",
    id: "spoken-english-dialogues",
  },
  {
    file: "public/resources/helpful/spoken-english-real-life-phrases-and-sentences.pdf",
    id: "spoken-english-real-life",
  },
  {
    file: "public/resources/ielts/ielts-reading-strategies-guide.pdf",
    id: "ielts-reading-strategies",
  },
  { file: "public/resources/ielts/ielts-speaking-sample-answer.pdf", id: "ielts-speaking-samples" },
  {
    file: "public/resources/ielts/ielts-speaking-strategies-guide.pdf",
    id: "ielts-speaking-strategies",
  },
  { file: "public/resources/ielts/reading-keywords-ielts-13.pdf", id: "ielts-reading-keywords" },
  { file: "public/resources/toefl/ace-the-toefl-essay.pdf", id: "ace-toefl-essay" },
  {
    file: "public/resources/toeic/tactics-for-toeic-listening-reading.pdf",
    id: "tactics-for-toeic",
  },
  { file: "public/resources/reading/gep-11b-unit-5-reading-quiz.pdf", id: "gep-11b-unit5-reading" },
  { file: "public/resources/reading/gep-11b-unit-6-reading-quiz.pdf", id: "gep-11b-unit6-reading" },
  { file: "public/resources/reading/gep-11b-unit-7-reading-quiz.pdf", id: "gep-11b-unit7-reading" },
  { file: "public/resources/reading/rfi-pt2-reading-v2.pdf", id: "rfi-pt2-reading" },
  {
    file: "public/resources/listening/gep-11b-unit-5-listening-quiz.pdf",
    id: "gep-11b-unit5-listening",
  },
];

const PROMPT = `Analyze this PDF document and extract its table of contents / chapter structure.

Return ONLY a valid JSON object with this exact structure, no markdown fencing:
{
  "title": "Full title of the book/document",
  "description": "A one-sentence description of what this resource covers",
  "chapters": [
    { "id": "ch1", "title": "Chapter/Section Title", "page": 1 },
    { "id": "ch2", "title": "Next Chapter/Section", "page": 5 }
  ]
}

Rules:
- Extract real chapter/section titles from the document
- Use actual page numbers from the PDF
- If there's a formal table of contents, use it
- If not, identify major sections/headings and their approximate page numbers
- Include 5-15 chapters max (merge small sections if needed)
- Keep chapter titles concise but descriptive
- The first chapter should usually start at page 1 or the first content page
- Return ONLY the JSON, no explanation`;

async function extractChapters(pdfPath: string, maxRetries = 3): Promise<any> {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const base64Pdf = pdfBuffer.toString("base64");

  const body = {
    contents: [
      {
        parts: [{ inlineData: { mimeType: "application/pdf", data: base64Pdf } }, { text: PROMPT }],
      },
    ],
    generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      const errBody = await res.json();
      const retryDelay = errBody?.error?.details?.find((d: any) => d.retryDelay)?.retryDelay;
      const waitSec = retryDelay ? parseInt(retryDelay) + 5 : 60;
      console.log(`    Rate limited. Waiting ${waitSec}s (attempt ${attempt}/${maxRetries})...`);
      await new Promise((r) => setTimeout(r, waitSec * 1000));
      continue;
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${err.substring(0, 200)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return JSON.parse(cleaned);
  }
  throw new Error("Max retries exceeded");
}

async function main() {
  const outPath = "scripts/courses-data.json";

  // Load existing results if any (resume support)
  let results: Record<string, any> = {};
  if (fs.existsSync(outPath)) {
    try {
      results = JSON.parse(fs.readFileSync(outPath, "utf-8"));
      console.log(`Resuming: ${Object.keys(results).length} already done`);
    } catch {}
  }

  for (let i = 0; i < PDF_FILES.length; i++) {
    const { file, id } = PDF_FILES[i];

    // Skip already processed
    if (results[id] && results[id].chapters?.length > 1) {
      console.log(`[${i + 1}/${PDF_FILES.length}] Skipping (already done): ${id}`);
      continue;
    }

    console.log(`[${i + 1}/${PDF_FILES.length}] Processing: ${path.basename(file)}...`);

    try {
      const chapData = await extractChapters(file);
      results[id] = {
        id,
        title: chapData.title,
        description: chapData.description,
        pdfUrl: "/" + file.replace("public/", ""),
        chapters: chapData.chapters,
      };
      console.log(`  ✓ Found ${chapData.chapters.length} chapters`);

      // Save after each success (crash resume)
      fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    } catch (e: any) {
      console.error(`  ✗ Error: ${e.message.substring(0, 100)}`);
      results[id] = {
        id,
        title: path.basename(file, ".pdf").replace(/-/g, " "),
        description: "Learning resource",
        pdfUrl: "/" + file.replace("public/", ""),
        chapters: [{ id: "ch1", title: "Start", page: 1 }],
      };
      fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    }

    // Wait 15s between requests to avoid rate limits
    if (i < PDF_FILES.length - 1) {
      console.log("  Waiting 15s...");
      await new Promise((r) => setTimeout(r, 15000));
    }
  }

  console.log(`\nDone! ${Object.keys(results).length} courses written to ${outPath}`);
}

main().catch(console.error);
