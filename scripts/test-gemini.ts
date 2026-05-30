const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.log("No GEMINI_API_KEY or VITE_GEMINI_API_KEY found in process.env");
  process.exit(0);
}

// Use gemini-2.0-flash
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function test() {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Hello, reply with 'Gemini 2.0 API key is working!'" }] }],
    }),
  });

  if (res.ok) {
    const data = await res.json();
    console.log("Response:", data.candidates?.[0]?.content?.parts?.[0]?.text);
  } else {
    console.error("Failed to query Gemini:", res.status, await res.text());
  }
}

test().catch(console.error);
