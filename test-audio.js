import { WebSocket } from "ws";
import * as fs from "fs";

const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

const ws = new WebSocket(wsUrl);

let audioData = Buffer.alloc(0);

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      setup: {
        model: "models/gemini-3.1-flash-live-preview",
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
        },
        systemInstruction: { parts: [{ text: "Say 'Hello world' and stop." }] },
      },
    }),
  );
});

ws.on("message", (data) => {
  const response = JSON.parse(data.toString());
  if (response.setupComplete) {
    ws.send(
      JSON.stringify({
        clientContent: {
          turns: [{ role: "user", parts: [{ text: "Hello!" }] }],
          turnComplete: true,
        },
      }),
    );
  }
  if (response.serverContent?.modelTurn) {
    const parts = response.serverContent.modelTurn.parts;
    parts.forEach((p) => {
      if (p.inlineData) {
        const buf = Buffer.from(p.inlineData.data, "base64");
        audioData = Buffer.concat([audioData, buf]);
      }
    });
  }
  if (response.serverContent?.turnComplete) {
    fs.writeFileSync("output.pcm", audioData);
    console.log("Saved output.pcm, size:", audioData.length);
    ws.close();
  }
});
