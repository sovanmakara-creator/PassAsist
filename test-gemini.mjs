import { WebSocket } from "ws";

async function run() {
  const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${process.env.GEMINI_API_KEY}`;
  const ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log("Connected");
    ws.send(JSON.stringify({
      setup: {
        model: "models/gemini-3.1-flash-live-preview",
        generationConfig: {
          responseModalities: ["AUDIO"],
        }
      }
    }));
  });

  ws.on('message', (data) => {
    const textData = data.toString();
    try {
      const response = JSON.parse(textData);
      if (response.setupComplete) {
        ws.send(JSON.stringify({
          clientContent: {
            turns: [{ role: "user", parts: [{ text: "Please say exactly 'Hello world' and nothing else." }] }],
            turnComplete: true
          }
        }));
      }
      if (response.serverContent?.modelTurn) {
        const parts = response.serverContent.modelTurn.parts;
        for (const p of parts) {
          if (p.text) console.log("Got TEXT chunk:", p.text);
          if (p.inlineData) console.log("Got AUDIO chunk");
        }
      }
      if (response.serverContent?.turnComplete) {
        console.log("Turn Complete");
        process.exit(0);
      }
    } catch(e) {}
  });
  
  ws.on('error', (e) => console.error("Error:", e));
  ws.on('close', (c, r) => console.log("Closed:", c, r.toString()));
}
run();
