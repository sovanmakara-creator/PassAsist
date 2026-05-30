const fs = require("fs");
const path = require("path");

async function main() {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
  if (!apiKey) {
    console.error("No API key");
    return;
  }

  const audioPath = path.join(__dirname, "public", "audio", "kenton-festival.mp3");
  const audioBuffer = fs.readFileSync(audioPath);
  const base64Audio = audioBuffer.toString("base64");

  const questions = `
Listen to the audio and find the answers to the following 10 fill-in-the-blank questions (ONE WORD AND/OR A NUMBER):
1. Opening ceremony: In town centre, starting at 1 ______
2. A 2 ______ will perform
3. Performance of a 3 ______ about Helen Tungate (a 4 ______)
4. Evening fireworks display situated across the 5 ______
5. Videos about relationships that children have with their 6 ______ (Venue: 7 ______ House)
6. Venue: 7 ______ House
7. Performance of 8 ______ dances
8. Venue: the 9 ______ market in the town centre
9. Tickets available online from festival box office and from shops which have the festival 10 ______ in their windows.

Output the answers as a simple JSON object mapping the question number string to the answer string, like {"1": "answer", "2": "answer"}. Output strictly JSON.
  `;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "audio/mp3",
              data: base64Audio,
            },
          },
          {
            text: questions,
          },
        ],
      },
    ],
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    console.error("API error", res.status, await res.text());
    return;
  }

  const json = await res.json();
  console.log(json.candidates[0].content.parts[0].text);
}

main().catch(console.error);
