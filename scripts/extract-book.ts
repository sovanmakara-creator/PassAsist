import fs from "fs";
import * as pdf from "pdf-parse";

const parse = (pdf as any).default || (pdf as any).pdf || pdf;

const buffer = fs.readFileSync("public/resources/ielts/secrets-to-ielts-success-band-8.pdf");
console.log("Keys:", Object.keys(pdf));
