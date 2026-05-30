import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Polyfill DOMMatrix for Node.js PDFJS environment
(globalThis as any).DOMMatrix = class DOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
  constructor() {}
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface Chapter {
  id: string;
  title: string;
  page: number;
}

// Map of manual overrides or specific helpers for popular resources to guarantee high quality
const SPECIAL_OUTLINES: Record<string, Chapter[]> = {
  "ielts-mock-secrets": [
    { id: "ch1", title: "About the Test", page: 4 },
    { id: "ch2", title: "The Writing Module - Task 2", page: 5 },
    { id: "ch3", title: "Essay Band Descriptors", page: 9 },
    { id: "ch4", title: "The Writing Module - Task 1", page: 13 },
    { id: "ch5", title: "Letter Writing", page: 18 },
    { id: "ch6", title: "The Speaking Module", page: 24 },
    { id: "ch7", title: "The Listening Module", page: 30 },
    { id: "ch8", title: "Listening Tips", page: 33 },
    { id: "ch9", title: "The Reading Module", page: 36 },
    { id: "ch10", title: "Reading Question Types", page: 41 },
    { id: "ch11", title: "Coda", page: 46 },
  ],
};

async function parsePdfChapters(pdfPath: string, pdfjsLib: any): Promise<Chapter[]> {
  try {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const chapters: Chapter[] = [];
    let chCount = 1;

    // 1. Try to fetch built-in outline (bookmarks) first
    try {
      const outline = await pdfDoc.getOutline();
      if (outline && outline.length > 0) {
        for (const item of outline) {
          let dest = item.dest;
          if (typeof dest === "string") {
            dest = await pdfDoc.getDestination(dest);
          }
          if (dest && dest[0]) {
            const pageRef = dest[0];
            const pageIndex = await pdfDoc.getPageIndex(pageRef);
            chapters.push({
              id: `ch${chCount++}`,
              title: item.title.trim(),
              page: pageIndex + 1,
            });
          }
        }
        if (chapters.length > 0) {
          return chapters;
        }
      }
    } catch (err) {
      console.warn("  Could not fetch built-in outline, falling back to text parsing...");
    }

    // 2. Fall back to text parsing page by page
    for (let p = 1; p <= numPages; p++) {
      const page = await pdfDoc.getPage(p);
      const textContent = await page.getTextContent();
      const strings = textContent.items
        .map((item: any) => item.str.trim())
        .filter((s: string) => s.length > 0);

      if (strings.length === 0) continue;

      // Look at the first 15 text elements for headings
      const headingCandidates = strings.slice(0, 15);

      // Rule A: Look for "Part X: Title" or "Unit X" or "Section X"
      let foundHeading = false;
      for (let i = 0; i < headingCandidates.length; i++) {
        const item = headingCandidates[i];

        // Match Part / Section / Unit / Chapter headings
        const matchesHeading = /^(Part|Unit|Section|Chapter|Topic)\s+\d+/i.test(item);
        if (matchesHeading && item.length < 100) {
          // If the next item is a title, combine them
          let title = item;
          if (
            i + 1 < headingCandidates.length &&
            headingCandidates[i + 1].length > 3 &&
            headingCandidates[i + 1].length < 60 &&
            !/^\d+/.test(headingCandidates[i + 1])
          ) {
            title += ": " + headingCandidates[i + 1];
          }

          // Avoid duplicate titles on successive pages
          if (!chapters.some((ch) => ch.title.toLowerCase() === title.toLowerCase())) {
            chapters.push({
              id: `ch${chCount++}`,
              title: title,
              page: p,
            });
            foundHeading = true;
            break;
          }
        }

        // Match numbered list headings like "10. As & like" or "1. Accused of"
        const matchesNumberedHeading = /^(\d+)\.$/.test(item); // Single number dot item
        if (matchesNumberedHeading && i + 1 < headingCandidates.length) {
          const nextItem = headingCandidates[i + 1];
          if (nextItem.length > 2 && nextItem.length < 50 && /^[A-Z]/.test(nextItem)) {
            const title = `${item} ${nextItem}`;
            if (!chapters.some((ch) => ch.title.toLowerCase() === title.toLowerCase())) {
              chapters.push({
                id: `ch${chCount++}`,
                title: title,
                page: p,
              });
              foundHeading = true;
              break;
            }
          }
        }

        // Also match inline format like "1. Accused of"
        const matchesInlineNumbered = /^(\d+)\.\s+([A-Z][A-Za-z0-9\s&,\-'’()]{3,50})$/.exec(item);
        if (matchesInlineNumbered) {
          const title = item;
          if (!chapters.some((ch) => ch.title.toLowerCase() === title.toLowerCase())) {
            chapters.push({
              id: `ch${chCount++}`,
              title: title,
              page: p,
            });
            foundHeading = true;
            break;
          }
        }
      }

      // Rule B: Match specific IELTS reading quiz sections
      if (!foundHeading) {
        for (const item of headingCandidates) {
          if (
            /^(Reading Passage|Listening Section|Passage|Part)\s+\d+/i.test(item) &&
            item.length < 50
          ) {
            if (!chapters.some((ch) => ch.title.toLowerCase() === item.toLowerCase())) {
              chapters.push({
                id: `ch${chCount++}`,
                title: item,
                page: p,
              });
              break;
            }
          }
        }
      }
    }

    // 3. Fallback: If still no chapters found, create page milestones for long PDFs
    if (chapters.length === 0) {
      chapters.push({ id: "ch1", title: "Document Start", page: 1 });
      if (numPages > 10) {
        // Add milestones every 5 pages for navigation ease
        for (let p = 5; p <= numPages; p += 5) {
          chapters.push({ id: `ch${chCount++}`, title: `Page ${p}`, page: p });
        }
      }
    }

    // Limit to 20 chapters maximum to prevent sidebar clutter
    return chapters.slice(0, 20);
  } catch (err) {
    console.error(`Error parsing chapters for ${pdfPath}:`, err);
    return [{ id: "ch1", title: "Document Start", page: 1 }];
  }
}

async function run() {
  console.log("Loading pdfjs-dist...");
  const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/build/pdf.worker.mjs");

  console.log("Fetching courses from Supabase...");
  const { data: courses, error } = await supabase.from("courses").select("*");

  if (error) {
    console.error("Failed to fetch courses:", error.message);
    return;
  }

  console.log(`Found ${courses.length} courses to analyze.`);

  for (const course of courses) {
    console.log(`\nAnalyzing course: "${course.title}" (${course.id})...`);

    // Check for special overrides first
    if (SPECIAL_OUTLINES[course.id]) {
      const chapters = SPECIAL_OUTLINES[course.id];
      console.log(`  ✓ Applying manual override outline: ${chapters.length} chapters.`);

      const { error: updateError } = await supabase
        .from("courses")
        .update({ chapters_json: chapters })
        .eq("id", course.id);

      if (updateError) {
        console.error(`  ✗ Failed to update: ${updateError.message}`);
      } else {
        console.log(`  ✓ Updated course chapters in Supabase.`);
      }
      continue;
    }

    const pdfUrl = course.pdf_url;
    if (!pdfUrl) {
      console.log(`  ! Skipping: no pdf_url.`);
      continue;
    }

    // Find the local file path
    // If pdfUrl is stored as a relative storage path (e.g. helpful/130-common-mistakes-in-english.pdf)
    // or as a full public url (which contains the path at the end)
    let relativePath = pdfUrl;
    if (pdfUrl.startsWith("http")) {
      const parts = pdfUrl.split("/object/public/pdfs/");
      if (parts.length > 1) {
        relativePath = decodeURIComponent(parts[1]);
      } else {
        console.log(`  ! Skipping: external HTTP URL cannot be processed locally.`);
        continue;
      }
    }

    let localFilePath = path.join(process.cwd(), "public/resources", relativePath);

    if (!fs.existsSync(localFilePath)) {
      const filename = path.basename(relativePath);
      const subdirs = [
        "listening",
        "reading",
        "writing",
        "speaking",
        "helpful",
        "ielts",
        "toefl",
        "toeic",
      ];
      let found = false;
      for (const dir of subdirs) {
        const testPath = path.join(process.cwd(), "public/resources", dir, filename);
        if (fs.existsSync(testPath)) {
          localFilePath = testPath;
          found = true;
          break;
        }
      }
      if (!found) {
        console.warn(`  ! Local file not found for: ${relativePath}`);
        continue;
      }
    }

    console.log(`  Parsing outline from local file: ${localFilePath}...`);
    const chapters = await parsePdfChapters(localFilePath, pdfjsLib);
    console.log(`  ✓ Extracted ${chapters.length} chapters:`);
    console.log(chapters.map((ch) => `    - [Page ${ch.page}] ${ch.title}`));

    // Update database
    const { error: updateError } = await supabase
      .from("courses")
      .update({ chapters_json: chapters })
      .eq("id", course.id);

    if (updateError) {
      console.error(`  ✗ Failed to update: ${updateError.message}`);
    } else {
      console.log(`  ✓ Updated course chapters in Supabase.`);
    }
  }

  console.log("\nChapter extraction process completed successfully!");
}

run().catch(console.error);
