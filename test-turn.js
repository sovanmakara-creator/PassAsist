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
          responseModalities: ["AUDIO"],
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const response = JSON.parse(data.toString());
  console.log("Response:", JSON.stringify(response));
  if (response.setupComplete) {
    console.log("Setup complete. Sending audio...");
    // send some dummy audio
    const dummyAudio = Buffer.alloc(2048).toString("base64");
    ws.send(
      JSON.stringify({
        realtimeInput: {
          mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: dummyAudio }],
        },
      }),
    );

    setTimeout(() => {
      console.log("Sending turn complete...");
      ws.send(
        JSON.stringify({
          clientContent: {
            turns: [
              { role: "user", parts: [{ text: "The user is done speaking. Please respond." }] },
            ],
            turnComplete: true,
          },
        }),
      );
    }, 1000);
  }
  if (response.serverContent?.modelTurn) {
    console.log("Got model turn!");
  }
  if (response.serverContent?.turnComplete) {
    console.log("Turn complete from server!");
    ws.close();
  }
  if (response.serverContent?.interrupted) {
    console.log("Interrupted!");
  }
});
