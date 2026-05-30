import fs from "fs";
import pdf from "pdf-parse";

const pdfFile = fs.readFileSync("public/resources/ielts/secrets-to-ielts-success-band-8.pdf");

pdf(pdfFile).then((data) => {
  fs.writeFileSync("book-raw.txt", data.text);
  console.log("Extracted to book-raw.txt");
});
