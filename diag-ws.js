import { WebSocket } from "ws";

const apiKey = process.env.GEMINI_API_KEY?.replace(/"/g, "")?.trim();
const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

const ws = new WebSocket(wsUrl);

ws.on("open", () => {
  console.log("Connected. Sending setup...");
  ws.send(
    JSON.stringify({
      setup: {
        model: "models/gemini-3.1-flash-live-preview",
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede",
              },
            },
          },
        },
        systemInstruction: {
          parts: [
            {
              text: "You are an official IELTS examiner. Strictly follow the IELTS interview format.",
            },
          ],
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const response = JSON.parse(data.toString());
  console.log("Received response keys:", Object.keys(response));
  if (response.setupComplete) {
    console.log("Setup complete! Sending first message.");
    ws.send(
      JSON.stringify({
        clientContent: {
          turns: [
            { role: "user", parts: [{ text: "Hello, I am ready to begin my speaking test." }] },
          ],
          turnComplete: true,
        },
      }),
    );
  }
  if (response.serverContent?.modelTurn) {
    const parts = response.serverContent.modelTurn.parts;
    parts.forEach((p, i) => {
      console.log(`Part ${i} keys:`, Object.keys(p));
      if (p.text) console.log("Text:", p.text);
      if (p.inlineData) console.log("Audio data length:", p.inlineData.data.length);
    });
  }
  if (response.serverContent?.turnComplete) {
    console.log("Turn complete.");
    ws.close();
  }
});

ws.on("error", (err) => {
  console.error("Error:", err);
});

ws.on("close", (code, reason) => {
  console.log("Closed:", code, reason.toString());
});
