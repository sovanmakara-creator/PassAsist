import { WebSocket } from "ws";

const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

const ws = new WebSocket(wsUrl);

ws.on("open", () => {
  console.log("open");
  ws.send(
    JSON.stringify({
      setup: {
        model: "models/gemini-3.1-flash-live-preview",
        generationConfig: {
          responseModalities: ["AUDIO", "TEXT"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } },
        },
      },
    }),
  );
});

ws.on("message", (data) => console.log("msg:", data.toString()));
ws.on("close", (code, reason) => console.log("close:", code, reason.toString()));
ws.on("error", (err) => console.log("err:", err));
