const apiKey = process.env.GEMINI_API_KEY;

async function run() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  const bidiModels = data.models.filter((m) =>
    m.supportedGenerationMethods.includes("bidiGenerateContent"),
  );
  console.log(bidiModels.map((m) => m.name));
}
run();
