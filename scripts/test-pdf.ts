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

async function test() {
  console.log("Loading pdfjs-dist dynamically...");
  const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/build/pdf.worker.mjs");

  // Secrets to IELTS Success PDF
  const testFile = "public/resources/ielts/secrets-to-ielts-success-band-8.pdf";
  if (!require("fs").existsSync(testFile)) {
    console.error(`File does not exist: ${testFile}`);
    return;
  }

  const data = new Uint8Array(require("fs").readFileSync(testFile));

  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDoc = await loadingTask.promise;
  console.log(`✓ Opened PDF: ${testFile}. Total pages: ${pdfDoc.numPages}`);

  const outline = await pdfDoc.getOutline();
  console.log("Outline:", outline ? `${outline.length} items` : "none");
  if (outline) {
    console.log("Outline items:");
    for (const item of outline) {
      console.log(`- ${item.title}`);
    }
  }
}

test().catch(console.error);
