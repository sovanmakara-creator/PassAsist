const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();

async function testSpeakingEndpoint() {
  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: "Exam: IELTS Speaking\nTask prompt:\nDescribe a book you read recently.\n\nEvaluate the user's spoken response provided in the audio clip." }
        ]
      }
    ]
  };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const text = await res.text();
    console.log("Speaking Endpoint Status:", res.status, text.slice(0, 300));
  } catch(e) {
    console.log("Speaking Endpoint Error:", e.message);
  }
}

async function testWritingEndpoint() {
  const payload = {
    model: "gemini-flash-latest",
    messages: [
      { role: "system", content: "You are an expert English writing examiner." },
      { role: "user", content: "Test essay response." }
    ]
  };
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const text = await res.text();
    console.log("Writing Endpoint Status:", res.status, text.slice(0, 300));
  } catch(e) {
    console.log("Writing Endpoint Error:", e.message);
  }
}

async function run() {
  await testSpeakingEndpoint();
  await testWritingEndpoint();
}
run();
