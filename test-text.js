import { WebSocket } from "ws";

const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

const ws = new WebSocket(wsUrl);

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      setup: {
        model: "models/gemini-3.1-flash-live-preview",
        generationConfig: {
          responseModalities: ["AUDIO", "TEXT"],
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
        console.log("Got AUDIO");
      }
      if (p.text) {
        console.log("Got TEXT:", p.text);
      }
    });
  }
  if (response.serverContent?.turnComplete) {
    console.log("Done");
    ws.close();
  }
});
