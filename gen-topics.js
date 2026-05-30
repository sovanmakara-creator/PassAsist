import * as fs from "fs";

async function generate() {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
  const generate100 = async (prompt) => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: { type: "array", items: { type: "string" } },
          },
        }),
      },
    );
    const data = await res.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  };

  console.log("Generating IELTS Part 1...");
  const ielts1 = await generate100(
    "Generate exactly 100 IELTS Speaking Part 1 questions. Return an array of strings.",
  );
  console.log("Generating IELTS Part 2...");
  const ielts2 = await generate100(
    "Generate exactly 100 IELTS Speaking Part 2 cue cards. Return an array of strings.",
  );
  console.log("Generating IELTS Part 3...");
  const ielts3 = await generate100(
    "Generate exactly 100 IELTS Speaking Part 3 discussion questions. Return an array of strings.",
  );
  console.log("Generating TOEFL Independent...");
  const toeflInd = await generate100(
    "Generate exactly 100 TOEFL Independent speaking topics. Return an array of strings.",
  );
  console.log("Generating TOEIC Read Text...");
  const toeicRead = await generate100(
    "Generate 100 short TOEIC read text announcements. Return an array of strings.",
  );
  console.log("Generating TOEIC Describe Picture...");
  const toeicPic = await generate100(
    "Generate 100 TOEIC describe picture prompts (e.g. Describe what you see in this picture. Imagine...). Return an array of strings.",
  );
  console.log("Generating TOEIC Respond to Questions...");
  const toeicResp = await generate100(
    "Generate 100 TOEIC respond to questions prompts. Return an array of strings.",
  );
  console.log("Generating TOEIC Express Opinion...");
  const toeicOp = await generate100(
    "Generate 100 TOEIC express opinion prompts. Return an array of strings.",
  );

  const output = `
export const TOEFL_TOPICS: Record<string, string[]> = {
  independent: ${JSON.stringify(toeflInd, null, 2)},
  integrated: ["Summarize the lecture and explain how it casts doubt on the reading.", "Summarize the points made in the lecture, being sure to explain how they respond to the specific points made in the reading passage about the advantages of working from home.", "Summarize the points made in the lecture, being sure to explain how they challenge the specific claims made in the reading passage about the benefits of ethanol fuel."],
  academic_discussion: ["Do you think online learning is effective?", "Should companies prioritize profits or social responsibility?", "What is the most effective way for individuals to reduce their carbon footprint?"]
};

export const TOEIC_TOPICS: Record<string, string[]> = {
  opinion_essay: ["Some companies block social media. Good or bad?", "Do you agree or disagree with the following statement? Companies should allow employees to work from home at least two days per week."],
  email: ["Respond to this customer email asking about a refund.", "Respond to the HR training email."],
  read_text: ${JSON.stringify(toeicRead, null, 2)},
  describe_picture: ${JSON.stringify(toeicPic, null, 2)},
  respond_to_questions: ${JSON.stringify(toeicResp, null, 2)},
  express_opinion: ${JSON.stringify(toeicOp, null, 2)}
};

export const IELTS_SPEAKING_TOPICS: Record<string, string[]> = {
  part1: ${JSON.stringify(ielts1, null, 2)},
  part2: ${JSON.stringify(ielts2, null, 2)},
  part3: ${JSON.stringify(ielts3, null, 2)}
};

export const TOEFL_SPEAKING_TOPICS: Record<string, string[]> = {
  independent: ${JSON.stringify(toeflInd, null, 2)}
};

export const TOEIC_SPEAKING_TOPICS = TOEIC_TOPICS;

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
`;
  fs.writeFileSync("src/services/topic-bank.ts", output);
  console.log("Done!");
}
generate();
