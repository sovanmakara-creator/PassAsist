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
  console.log("Loading pdfjs-dist...");
  const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/build/pdf.worker.mjs");

  const testFile = "public/resources/helpful/130-common-mistakes-in-english.pdf";
  const data = new Uint8Array(require("fs").readFileSync(testFile));

  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDoc = await loadingTask.promise;
  console.log(`Opened PDF. Total pages: ${pdfDoc.numPages}`);

  // Let's inspect text from first 5 pages
  for (let p = 1; p <= Math.min(10, pdfDoc.numPages); p++) {
    const page = await pdfDoc.getPage(p);
    const textContent = await page.getTextContent();
    const strings = textContent.items
      .map((item: any) => item.str.trim())
      .filter((s: string) => s.length > 0);

    console.log(`\n--- Page ${p} ---`);
    console.log("First 5 text items:", strings.slice(0, 5));

    // Look for headings: e.g. "Mistake X" or capitalized titles
    const headings = strings.filter((s) => {
      const isMistake = /Mistake\s+\d+/i.test(s);
      const isTopic = /Topic\s+\d+/i.test(s);
      const isChapter = /Chapter\s+\d+/i.test(s);
      const isUnit = /Unit\s+\d+/i.test(s);
      return isMistake || isTopic || isChapter || isUnit;
    });
    if (headings.length > 0) {
      console.log("Detected Headings on this page:", headings);
    }
  }
}

test().catch(console.error);
