import fs from "fs";
import path from "path";
// @ts-ignore
import { EXAM_RESOURCES, HELPFUL_SOURCES } from "../src/services/exam-resources.ts";

const allResources = [];

// Get all helpful sources
for (const r of HELPFUL_SOURCES) {
  if (r.url.endsWith(".pdf")) {
    allResources.push(r);
  }
}

// Get all exam resources
for (const [examCode, sections] of Object.entries(EXAM_RESOURCES)) {
  for (const [sectionKey, resources] of Object.entries(sections as any)) {
    if (Array.isArray(resources)) {
      for (const r of resources) {
        if (r.url.endsWith(".pdf")) {
          allResources.push(r);
        }
      }
    }
  }
}

let coursesOutput = `export type Chapter = {
  id: string;
  title: string;
  page: number;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  chapters: Chapter[];
};

export const COURSES: Record<string, Course> = {
`;

// Add the hardcoded one we want to keep exactly as is
coursesOutput += `  "ielts-mock-secrets": {
    id: "ielts-mock-secrets",
    title: "Secrets to IELTS Success: Band 8",
    description: "An IELTS expert's guide to the IELTS test by Nerada Turner.",
    pdfUrl: "/resources/ielts/secrets-to-ielts-success-band-8.pdf",
    chapters: [
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
  },\n`;

// Generate the rest
for (const r of allResources) {
  // Skip the hardcoded one we already added
  if (r.id === "ielts-mock-secrets") continue;

  coursesOutput += `  "${r.id}": {
    id: "${r.id}",
    title: ${JSON.stringify(r.title)},
    description: ${JSON.stringify(r.description)},
    pdfUrl: ${JSON.stringify(r.url)},
    chapters: [
      { id: "ch1", title: "Document Start", page: 1 }
    ]
  },\n`;
}

coursesOutput += `};\n`;

fs.writeFileSync("src/services/course-data.ts", coursesOutput);
console.log("Generated course-data.ts with " + allResources.length + " PDFs.");
