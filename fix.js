const fs = require("fs");
const content = fs.readFileSync("src/routes/examiner.tsx", "utf-8");
const updated = content
  .replace(
    "const [isSpeaking, setIsSpeaking] = useState(false);",
    "const [isSpeaking, setIsSpeaking] = useState(false);\n  const isSpeakingRef = useRef(false);\n  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);",
  )
  .replace(
    'if (ws.readyState === WebSocket.OPEN && statusRef.current === "connected" && isSetupComplete) {',
    'if (ws.readyState === WebSocket.OPEN && statusRef.current === "connected" && isSetupComplete && !isSpeakingRef.current) {',
  )
  .replace(
    "if (response.setupComplete) {\n          isSetupComplete = true;\n          ws.send(JSON.stringify({",
    "if (response.setupComplete) {\n          isSetupComplete = true;\n          isSpeakingRef.current = true;\n          setIsSpeaking(true);\n          ws.send(JSON.stringify({",
  )
  .replace(
    'const forceTurnCompleteWithInstruction = (instruction?: string) => {\n    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {\n      let parts = [{ text: " " }];',
    'const forceTurnCompleteWithInstruction = (instruction?: string) => {\n    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {\n      isSpeakingRef.current = true;\n      setIsSpeaking(true);\n      let parts = [{ text: " " }];',
  );

fs.writeFileSync("src/routes/examiner.tsx", updated);
console.log("Updated examiner.tsx");
