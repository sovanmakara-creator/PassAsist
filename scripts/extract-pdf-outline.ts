import fs from "fs";
import path from "path";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";

// Prevent worker errors in Node
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

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

async function extractOutline(pdfPath: string): Promise<any[]> {
  try {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDoc = await loadingTask.promise;
    const outline = await pdfDoc.getOutline();

    if (!outline || outline.length === 0) {
      // Return a dummy outline
      return [
        {
          title: "Document Start",
          pageIndex: 0,
        },
      ];
    }

    const results = [];
    let count = 1;
    for (const item of outline) {
      if (item.dest) {
        // Resolve destination to page number
        let dest = item.dest;
        if (typeof dest === "string") {
          dest = await pdfDoc.getDestination(dest);
        }
        if (dest && dest[0]) {
          const pageRef = dest[0];
          const pageIndex = await pdfDoc.getPageIndex(pageRef);
          results.push({
            id: `ch${count++}`,
            title: item.title,
            page: pageIndex + 1,
          });
        }
      } else {
        // No destination, just guess page 1
        results.push({
          id: `ch${count++}`,
          title: item.title,
          page: 1,
        });
      }
    }
    return results;
  } catch (err) {
    console.error("Error extracting outline:", err);
    return [{ title: "Start", page: 1, id: "ch1" }];
  }
}

async function main() {
  const results: Record<string, any> = {};

  for (let i = 0; i < PDF_FILES.length; i++) {
    const { file, id } = PDF_FILES[i];
    console.log(`Processing: ${path.basename(file)}...`);

    const chapters = await extractOutline(file);

    // Fallback if no chapters or only 1 dummy chapter
    let finalChapters = chapters;
    if (!chapters || chapters.length === 0 || !chapters[0].id) {
      finalChapters = [{ id: "ch1", title: "Start", page: 1 }];
    }

    results[id] = {
      id,
      title: path.basename(file, ".pdf").replace(/-/g, " "),
      description: "Learning resource",
      pdfUrl: "/" + file.replace("public/", ""),
      chapters: finalChapters.slice(0, 15), // limit to 15 chapters
    };

    console.log(`  ✓ Found ${finalChapters.length} chapters`);
  }

  const outPath = "src/services/course-data.ts";
  fs.writeFileSync(outPath, `export const COURSE_DATA = ${JSON.stringify(results, null, 2)};`);
  console.log(`Done! Written to ${outPath}`);
}

main().catch(console.error);
