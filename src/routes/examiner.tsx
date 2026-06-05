import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { getGeminiLiveToken } from "@/services/gemini.functions";
import { fetchSpeakingTopic, analyzeSpeaking, fetchTopicList } from "@/services/speaking.functions";
import { progressTracker } from "@/services/progress-tracker";
import { toast } from "sonner";
import {
  Mic,
  PhoneOff,
  PhoneCall,
  Loader2,
  Sparkles,
  Volume2,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/examiner")({
  head: () => ({
    meta: [
      { title: "Live AI Examiner — PassAssist" },
      { name: "description", content: "Real-time voice conversation with an AI examiner." },
    ],
  }),
  component: ExaminerPage,
});

// Helper to convert base64 to Int16Array
function base64ToInt16Array(base64: string): Int16Array {
  const standardBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (standardBase64.length % 4)) % 4);
  const binaryString = window.atob(standardBase64 + padding);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Ensure length is even
  const evenLen = len % 2 === 0 ? len : len - 1;
  const buffer = bytes.buffer.slice(0, evenLen);
  return new Int16Array(buffer);
}

// Helper to convert Int16Array to base64
function int16ArrayToBase64(int16Array: Int16Array): string {
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = "";
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return window.btoa(binary);
}

const getPartsForExam = (exam: string) => {
  if (exam === "toefl_speaking") {
    return [
      { value: "independent", label: "Independent" },
      { value: "full_mock", label: "Full Mock Test" },
    ];
  }
  if (exam === "toeic_speaking") {
    return [
      { value: "read_text", label: "Read Text" },
      { value: "describe_picture", label: "Describe Picture" },
      { value: "respond_to_questions", label: "Respond to Questions" },
      { value: "express_opinion", label: "Express Opinion" },
      { value: "full_mock", label: "Full Mock Test" },
    ];
  }
  return [
    { value: "part1", label: "Part 1 / Introduction" },
    { value: "part2", label: "Part 2 / Long Turn" },
    { value: "part3", label: "Part 3 / Discussion" },
    { value: "full_mock", label: "Full Mock Test" },
  ];
};

const formatTime = (sec: number) =>
  `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;

const getTurnLimit = (exam: string, sectionPart: string): number => {
  if (exam === "ielts_speaking") {
    if (sectionPart === "part1") return 35;
    if (sectionPart === "part2") return 120;
    if (sectionPart === "part3") return 45;
    if (sectionPart === "full_mock") return 120;
  } else if (exam === "toefl_speaking") {
    if (sectionPart === "full_mock") return 60;
    return 45;
  } else if (exam === "toeic_speaking") {
    if (sectionPart === "read_text") return 45;
    if (sectionPart === "describe_picture") return 30;
    if (sectionPart === "respond_to_questions") return 30;
    if (sectionPart === "express_opinion") return 60;
    if (sectionPart === "full_mock") return 60;
  }
  return 999;
};

export function ExaminerPage() {
  const [examType, setExamType] = useState("ielts_speaking");
  const [part, setPart] = useState("part1");
  const [voice, setVoice] = useState("Aoede");
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [transcript, setTranscript] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [currentModelText, setCurrentModelText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  const [isWaitingForModel, setIsWaitingForModel] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const addDebugLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 99)]);
    console.log(`[Gemini Live Debug] ${msg}`);
  };

  const audioChunksSentRef = useRef(0);

  const [totalSeconds, setTotalSeconds] = useState(0);
  const [currentTurnSeconds, setCurrentTurnSeconds] = useState(0);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number>(-1); // -1 means Random
  const [activeTopicPrompt, setActiveTopicPrompt] = useState("");
  const [showLiveSession, setShowLiveSession] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const backgroundRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");

  const recognitionRef = useRef<any>(null);
  const currentModelTextRef = useRef("");
  const isWaitingForModelRef = useRef(false);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const statusRef = useRef(status);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const renderTranscriptMessage = (msg: { role: "user" | "model"; text: string }, index: number) => {
    const isUser = msg.role === "user";
    const isVoicePlaceholder = msg.role === "model" && msg.text.startsWith("🔊");

    return (
      <div
        key={index}
        className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : ""}`}
      >
        <div
          className={`size-8 rounded-full shrink-0 flex items-center justify-center shadow-sm border transition-colors ${
            isUser
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-accent/10 border-accent/20 text-accent"
          }`}
        >
          {isUser ? (
            <User className="size-4" />
          ) : (
            <Volume2 className="size-4" />
          )}
        </div>
        <div
          className={`p-3.5 rounded-2xl shadow-sm leading-relaxed transition-all duration-200 ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : isVoicePlaceholder
              ? "bg-accent/5 border border-accent/20 text-accent rounded-tl-sm"
              : "bg-card border border-border rounded-tl-sm"
          }`}
        >
          {isVoicePlaceholder ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 shrink-0 bg-accent/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-accent">
                <span className="size-1.5 bg-accent rounded-full animate-ping"></span>
                Audio
              </div>
              <span className="text-sm font-medium text-foreground">Examiner voice response</span>
            </div>
          ) : (
            <p className="text-sm">{msg.text}</p>
          )}
        </div>
      </div>
    );
  };


  // Keep statusRef in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, currentModelText]);

  // Update part selection when exam changes
  useEffect(() => {
    const parts = getPartsForExam(examType);
    const isValidPart = parts.find((p) => p.value === part);
    if (!isValidPart) setPart(parts[0].value);
  }, [examType, part]);

  // Load topics list when exam or part changes
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const res = await fetchTopicList({ data: { exam: examType as any, part } });
        setTopics(res.topics || []);
        setSelectedTopicIndex(-1); // Reset to Random topic
      } catch (err) {
        console.error("Failed to load topics list:", err);
      }
    };
    loadTopics();
  }, [examType, part]);

  // Total Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "connected") {
      interval = setInterval(() => setTotalSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Per-question auto-interrupt Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "connected" && !isSpeaking) {
      interval = setInterval(() => {
        setCurrentTurnSeconds((s) => {
          const newS = s + 1;
          // Time limits based on exam
          let limit = 999;
          if (examType === "ielts_speaking") {
            if (part === "part1") limit = 35;
            else if (part === "part2") limit = 120;
            else if (part === "part3") limit = 45;
            else if (part === "full_mock") limit = 120;
          } else if (examType === "toefl_speaking") {
            if (part === "full_mock") limit = 60;
            else limit = 45;
          } else if (examType === "toeic_speaking") {
            if (part === "read_text") limit = 45;
            else if (part === "describe_picture") limit = 30;
            else if (part === "respond_to_questions") limit = 30;
            else if (part === "express_opinion") limit = 60;
            else if (part === "full_mock") limit = 60;
          }

          if (newS >= limit) {
            forceTurnCompleteWithInstruction(
              `The user's time limit of ${limit} seconds for this section has expired. Interrupt them immediately, thank them, and ask the next question or conclude.`,
            );
            return 0; // reset
          }
          return newS;
        });
      }, 1000);
    } else {
      setCurrentTurnSeconds(0);
    }
    return () => clearInterval(interval);
  }, [status, isSpeaking, examType, part]);

  const connect = async (topicIdx: number = selectedTopicIndex) => {
    // Instantiate AudioContext immediately inside the user gesture boundary
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const tempCtx = new AudioContextClass();
    tempCtx.resume().catch(() => {});

    addDebugLog(`Connecting to exam: ${examType}, part: ${part}`);
    audioChunksSentRef.current = 0;

    try {
      setShowLiveSession(true);
      setStatus("connecting");
      setTranscript([]);
      setFeedback(null);
      setAudioBlob(null);
      setTotalSeconds(0);
      setCurrentTurnSeconds(0);
      currentModelTextRef.current = "";
      setCurrentModelText("");
      isWaitingForModelRef.current = false;
      setIsWaitingForModel(false);
      setActiveTopicPrompt("");

      const topicRes = await fetchSpeakingTopic({
        data: { exam: examType as any, part, topicIndex: topicIdx },
      });
      const promptText = topicRes.task;
      setActiveTopicPrompt(promptText);

      const tokenRes = await getGeminiLiveToken();
      if (!tokenRes.success || !tokenRes.apiKey) {
        throw new Error(tokenRes.error || "GEMINI_API_KEY is missing. Please check your Netlify environment variables.");
      }
      const apiKey = tokenRes.apiKey;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let newlyFinalized = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              newlyFinalized += event.results[i][0].transcript + " ";
            }
          }
          if (newlyFinalized.trim()) {
            addDebugLog(`SpeechRecognition final: "${newlyFinalized.trim()}"`);
            setTranscript((prev) => [...prev, { role: "user", text: newlyFinalized.trim() }]);
          }
        };

        recognition.onend = () => {
          addDebugLog("SpeechRecognition ended");
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
              addDebugLog("SpeechRecognition restarting...");
              recognition.start();
            } catch (e) {}
          }
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.error("Failed to start speech recognition", e);
        }
      }

      const ctx = tempCtx;
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => {});
      }
      audioContextRef.current = ctx;

      await ctx.audioWorklet.addModule("/audio-processor.js");

      addDebugLog("Requesting microphone stream...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      addDebugLog("Microphone stream acquired.");

      // Setup Background Recorder for Evaluation
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "audio/mp4";
      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      backgroundRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        setAudioBlob(blob);
      };
      mediaRecorder.start(1000);

      const source = ctx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(ctx, "audio-processor");
      workletNodeRef.current = workletNode;

      addDebugLog("Connecting WebSocket client...");
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      let isSetupComplete = false;

      ws.onopen = () => {
        setStatus("connected");
        addDebugLog("WebSocket connected. Sending setup frame...");

        let rules = "";
        if (part === "full_mock") {
          if (examType === "ielts_speaking") {
            rules = `You are an official IELTS examiner conducting a FULL Mock Speaking Test (Parts 1, 2, and 3) in a single continuous session. 
You must guide the student through all three parts sequentially:
- PART 1 (Introduction & Interview): Greet the candidate and ask 2-3 brief personal questions on familiar topics (e.g., home, studies, hobbies, daily routine).
- PART 2 (Individual Long Turn): Introduce Part 2 clearly. Read the cue card prompt: "${promptText}". Tell the candidate: "You have one minute to prepare. I will tell you when to start speaking. Please start speaking now." (Simulate or give brief instruction). They should speak for 1 to 2 minutes. Listen to their response without interrupting.
- PART 3 (Two-way Discussion): Transition to Part 3 by saying: "Now, let's move to Part 3. I will ask you some discussion questions related to the topic of Part 2." Ask 2-3 abstract, analytical questions related to the cue card prompt.
Announce each part transition clearly so the candidate knows the progression of the exam. Keep the conversation extremely natural, professional, and realistic.`;
          } else if (examType === "toefl_speaking") {
            rules = `You are a TOEFL examiner conducting a FULL Mock Speaking Test simulating all 4 Tasks in a single session:
- Task 1 (Independent): Present the prompt: "${promptText}". Tell the candidate they have 15 seconds to prepare and 45 seconds to speak.
- Task 2 (Campus Announcement): Act as an examiner introducing a university policy change (e.g., a new library policy), then play the role of a student expressing a strong opinion about it. Ask the candidate to summarize the change and the student's opinion.
- Task 3 (Academic Concept): Briefly explain an academic concept (e.g., 'Cognitive Dissonance' or 'Mutualism') with a quick example. Ask the candidate to explain the concept and the example.
- Task 4 (Academic Lecture): Summarize a lecture with two main points/examples (e.g., two ways plants adapt to dry soil). Ask the candidate to summarize the lecture.
Clearly guide the student through each of the four tasks sequentially, telling them the preparation and speaking time constraints for each task.`;
          } else if (examType === "toeic_speaking") {
            rules = `You are a TOEIC examiner conducting a FULL Mock Speaking Test simulating the major speaking tasks:
- Read a text aloud (Task 1-2): Present a short passage or announcement for the student to read.
- Describe a picture (Task 3-4): Describe a visual scenario (e.g., 'an office setting with two people working') and ask the candidate to describe it in detail.
- Respond to questions (Task 5-7): Ask 3 quick business or customer service questions.
- Express an opinion (Task 11): Present the main prompt: "${promptText}". Ask the candidate to state and support their opinion on this topic.
Clearly guide the candidate through each step with clear instructions and questions.`;
          }
        } else {
          if (examType === "ielts_speaking") {
            rules =
              "You are an official IELTS examiner. Strictly follow the IELTS interview format. Keep questions short. Wait for the user to finish their thought before asking the next question.";
          } else if (examType === "toefl_speaking") {
            rules =
              "You are a TOEFL evaluator simulating an independent speaking task. Just ask the question and listen to the response.";
          } else if (examType === "toeic_speaking") {
            rules =
              "You are a TOEIC examiner. Follow the specific format of the TOEIC speaking section strictly.";
          }
        }

        const examName = examType.replace("_", " ").toUpperCase();
        const sectionLabel = part === "full_mock" ? "Full Mock Speaking Test" : part;
        const systemInstruction = `${rules} The student is taking ${examName} (${sectionLabel}). 
The core prompt is: "${promptText}".
Start by greeting the student and asking the first question. 
If the candidate says they are finished speaking, or if you receive an instruction that their time has expired, thank them and immediately ask the next question or move to the next part of the exam.
Keep your responses conversational, concise, and natural.`;

        console.log("[Gemini Live WS] Sending setup frame");
        ws.send(
          JSON.stringify({
            setup: {
              model: "models/gemini-3.1-flash-live-preview",
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: voice,
                    },
                  },
                },
              },
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },
              outputAudioTranscription: {},
            },
          }),
        );
      };

      workletNode.port.onmessage = (event) => {
        if (
          ws.readyState === WebSocket.OPEN &&
          statusRef.current === "connected" &&
          isSetupComplete &&
          !isWaitingForModelRef.current &&
          !isSpeakingRef.current
        ) {
          const int16Array = new Int16Array(event.data);
          const base64Data = int16ArrayToBase64(int16Array);
          ws.send(
            JSON.stringify({
              realtimeInput: {
                audio: {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64Data,
                },
              },
            }),
          );
          audioChunksSentRef.current += 1;
          if (audioChunksSentRef.current % 50 === 0) {
            addDebugLog(`Sent ${audioChunksSentRef.current} mic audio chunks`);
          }
        }
      };

      source.connect(workletNode);
      workletNode.connect(ctx.destination);

      // Explicitly resume the AudioContext now that all nodes are connected and mic is active
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => {});
      }

      let nextPlayTime = 0;
      const playAudioChunk = (base64Audio: string) => {
        try {
          const int16Array = base64ToInt16Array(base64Audio);
          if (int16Array.length === 0) return;

          const float32Array = new Float32Array(int16Array.length);
          for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
          }

          if (ctx.state === "closed") {
            return;
          }

          const buffer = ctx.createBuffer(1, float32Array.length, 24000);
          buffer.getChannelData(0).set(float32Array);

          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);

          activeSourcesRef.current.push(source);
          source.onended = () => {
            activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
          };

          if (ctx.state === "suspended") {
            ctx.resume().catch(() => {});
          }

          const currentTime = ctx.currentTime;
          if (nextPlayTime < currentTime) nextPlayTime = currentTime;

          source.start(nextPlayTime);
          nextPlayTime += buffer.duration;
        } catch (err) {
          addDebugLog(`Error playing audio chunk: ${err}`);
        }
      };

      ws.onmessage = async (event) => {
        try {
          let textData = "";
          try {
            if (typeof event.data === "string") textData = event.data;
            else textData = await new Response(event.data).text();
          } catch (e) {
            addDebugLog(`Error decoding frame: ${e}`);
            return;
          }

          let response;
          try {
            response = JSON.parse(textData);
          } catch (err) {
            addDebugLog(`JSON parse error: ${err}`);
            return;
          }

          if (response.setupComplete) {
            addDebugLog("WS: setupComplete received");
            isSetupComplete = true;
            isSpeakingRef.current = true;
            setIsSpeaking(true);
            isWaitingForModelRef.current = true;
            setIsWaitingForModel(true);
            
            // Safety timeout to prevent permanent mic muting if server fails to greet (15 seconds)
            setTimeout(() => {
              if (isWaitingForModelRef.current && wsRef.current === ws) {
                addDebugLog("setupComplete safety timeout fired. Resetting guard.");
                isWaitingForModelRef.current = false;
                setIsWaitingForModel(false);
              }
            }, 15000);

            console.log("[Gemini Live WS] Sending initial greeting clientContent");
            ws.send(
              JSON.stringify({
                clientContent: {
                  turns: [
                    {
                      role: "user",
                      parts: [{ text: "Hello, I am ready to begin my speaking test." }],
                    },
                  ],
                  turnComplete: true,
                },
              }),
            );
          }

          if (response.serverContent?.modelTurn) {
            addDebugLog("WS: modelTurn (speaking started)");
            isSpeakingRef.current = true;
            setIsSpeaking(true);
            isWaitingForModelRef.current = false;
            setIsWaitingForModel(false);
            
            if (!currentModelTextRef.current) {
              currentModelTextRef.current = "🔊 [Examiner Voice Response]";
              setCurrentModelText("🔊 [Examiner Voice Response]");
            }

            const parts = response.serverContent.modelTurn.parts;
            for (const part of parts) {
              if (part.text) {
                if (currentModelTextRef.current === "🔊 [Examiner Voice Response]") {
                  currentModelTextRef.current = part.text;
                } else {
                  currentModelTextRef.current += part.text;
                }
                setCurrentModelText(currentModelTextRef.current);
              }
              if (part.inlineData?.data) playAudioChunk(part.inlineData.data);
            }
          }

          if (response.serverContent?.turnComplete) {
            addDebugLog("WS: turnComplete (speaking finished)");
            isSpeakingRef.current = false;
            setIsSpeaking(false);
            isWaitingForModelRef.current = false;
            setIsWaitingForModel(false);
            if (currentModelTextRef.current) {
              setTranscript((prev) => [
                ...prev,
                { role: "model", text: currentModelTextRef.current },
              ]);
              currentModelTextRef.current = "";
              setCurrentModelText("");
            }
          }

          if (response.serverContent?.interrupted) {
            addDebugLog("WS: interrupted received");
            nextPlayTime = 0;
            isSpeakingRef.current = false;
            setIsSpeaking(false);
            isWaitingForModelRef.current = false;
            setIsWaitingForModel(false);
            currentModelTextRef.current = "";
            setCurrentModelText("");
            
            // Stop all scheduled/playing audio chunks
            activeSourcesRef.current.forEach((s) => {
              try {
                s.stop();
              } catch (e) {}
            });
            activeSourcesRef.current = [];
          }
        } catch (error) {
          addDebugLog(`Exception in onmessage: ${error}`);
        }
      };

      ws.onerror = (e) => {
        addDebugLog("WS: error occurred");
        toast.error("Connection error with the Live API.");
        disconnect();
      };

      ws.onclose = (event) => {
        addDebugLog(`WS: closed (code: ${event.code}, reason: ${event.reason || "none"})`);
        disconnect();
      };
    } catch (e: any) {
      console.error("[Gemini Live Error]", e);
      addDebugLog(`Error starting session: ${e.message || e}`);
      toast.error(e.message || "Failed to start interview.");
      disconnect();
    }
  };

  const disconnect = () => {
    if (statusRef.current === "idle") return;
    addDebugLog("disconnect() called");
    setStatus("idle");
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    isWaitingForModelRef.current = false;
    setIsWaitingForModel(false);

    // Stop all scheduled/playing audio chunks
    activeSourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (backgroundRecorderRef.current && backgroundRecorderRef.current.state !== "inactive") {
      backgroundRecorderRef.current.stop();
    }
  };

  const forceTurnCompleteWithInstruction = (instruction?: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      addDebugLog("forceTurnComplete called but WS not open!");
      return;
    }

    addDebugLog(`forceTurnComplete called. instruction=${instruction || "none"}`);

    // Pause mic sending immediately
    isWaitingForModelRef.current = true;
    setIsWaitingForModel(true);

    // Safety timeout to prevent permanent mic muting and re-enable "Done Speaking" button if server fails to respond (15 seconds)
    setTimeout(() => {
      if (isWaitingForModelRef.current && wsRef.current === ws) {
        addDebugLog("forceTurnComplete safety timeout fired. Resetting guard.");
        isWaitingForModelRef.current = false;
        setIsWaitingForModel(false);
      }
    }, 15000);

    const textPart = instruction
      ? `[SYSTEM INSTRUCTION: ${instruction}]`
      : "I have finished speaking my response. Please ask the next question.";

    addDebugLog("Sending clientContent with turns and turnComplete: true");
    ws.send(
      JSON.stringify({
        clientContent: {
          turns: [
            {
              role: "user",
              parts: [{ text: textPart }],
            },
          ],
          turnComplete: true,
        },
      })
    );
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleGetEvaluation = async () => {
    if (!audioBlob) {
      toast.error("No audio recorded.");
      return;
    }
    setIsEvaluating(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const fb = await analyzeSpeaking({
        data: {
          exam: examType as any,
          task: part === "full_mock"
            ? `Live Full Mock Test session for ${examType.replace("_", " ").toUpperCase()}. Core Topic/Cue Card: ${activeTopicPrompt}`
            : `Live Interview session for ${examType.replace("_", " ").toUpperCase()} ${part}. Prompt: ${activeTopicPrompt}`,
          audioBase64: base64Audio,
          mimeType: mimeTypeRef.current,
        },
      });
      setFeedback(fb);
      const evalTask = part === "full_mock"
        ? `Live Full Mock Test: ${activeTopicPrompt}`
        : `Live Interview (${part}): ${activeTopicPrompt}`;
      progressTracker.saveSpeakingScore(examType, evalTask, fb.band_score, fb);
      toast.success("Evaluation complete!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to get evaluation.");
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    return () => disconnect();
  }, []);

  const handleBackToTopics = () => {
    disconnect();
    setFeedback(null);
    setTranscript([]);
    setTotalSeconds(0);
    setActiveTopicPrompt("");
    setShowLiveSession(false);
  };

  const isCallActive = showLiveSession;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col min-h-[calc(100vh-80px)]">
        <PageHeader
          title="Live AI Examiner"
          description="Have a real-time voice conversation with an AI examiner. Speak naturally."
        >
          <ShareButton
            title="Live AI Examiner — PassAssist"
            description="Have a real-time voice conversation with an AI examiner. Speak naturally and get immediate band scores."
          />
        </PageHeader>

        <div className="flex-1 flex flex-col lg:flex-row gap-6">
          {!isCallActive ? (
            <div className="space-y-6 flex-1 pb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg">Select a Speaking Topic</h3>
                  <p className="text-muted-foreground text-sm">
                    Choose an exam, section part, and voice model to begin the live voice interview.
                  </p>
                </div>
              </div>

              {/* Selector Bars */}
              <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-wrap gap-4 items-center">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Exam Type</label>
                  <Select value={examType} onValueChange={setExamType}>
                    <SelectTrigger className="w-[180px] bg-background">
                      <SelectValue placeholder="Select Exam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ielts_speaking">IELTS Speaking</SelectItem>
                      <SelectItem value="toefl_speaking">TOEFL Speaking</SelectItem>
                      <SelectItem value="toeic_speaking">TOEIC Speaking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Section / Part</label>
                  <Select value={part} onValueChange={setPart}>
                    <SelectTrigger className="w-[200px] bg-background">
                      <SelectValue placeholder="Select Part" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPartsForExam(examType).map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Examiner Voice</label>
                  <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger className="w-[160px] bg-background">
                      <SelectValue placeholder="Voice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aoede">Aoede (Female)</SelectItem>
                      <SelectItem value="Kore">Kore (Female)</SelectItem>
                      <SelectItem value="Puck">Puck (Male)</SelectItem>
                      <SelectItem value="Charon">Charon (Male)</SelectItem>
                      <SelectItem value="Fenrir">Fenrir (Male)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Grid of Topics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Random Card */}
                <div
                  onClick={() => {
                    setSelectedTopicIndex(-1);
                    connect(-1);
                  }}
                  className="group relative rounded-2xl border-2 border-dashed border-accent/40 bg-accent/5 p-6 hover:border-accent hover:bg-accent/10 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-md"
                >
                  <div className="absolute top-4 right-4 text-accent">
                    <Sparkles className="size-5 animate-pulse group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="font-bold text-accent text-base">Dynamic prompt topic</h4>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Generate a completely unique topic dynamically using Gemini.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-accent uppercase tracking-wider">
                    Start call <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Topics from DB/bank */}
                {topics.map((t, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedTopicIndex(idx);
                      connect(idx);
                    }}
                    className="group rounded-2xl border border-border bg-card p-6 hover:border-accent hover:bg-accent/5 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-md"
                  >
                    <div>
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted text-muted-foreground uppercase border border-border">
                        Topic #{idx + 1}
                      </span>
                      <p className="text-xs text-foreground/80 mt-3 line-clamp-3 leading-relaxed" title={t}>
                        {t}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-accent uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                      Start call <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row gap-6">
              {/* Left Column: Prompt & Call Controls (only during active call) */}
              {!feedback && !isEvaluating ? (
                <div className="flex-1 lg:max-w-md flex flex-col gap-6 shrink-0">
                  {/* Active topic description on top */}
                  <div className="bg-card border border-border rounded-xl p-5 shadow-sm shrink-0 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-accent">Active Topic Prompt</span>
                      {status !== "connected" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBackToTopics}
                          className="h-8 text-xs cursor-pointer px-3"
                        >
                          Back to Topics
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-foreground leading-relaxed italic bg-surface/50 border p-3 rounded-lg font-medium">
                      {activeTopicPrompt || `Live Interview session for ${examType.replace("_", " ").toUpperCase()}`}
                    </p>
                  </div>

                  {/* Call Controls and Indicators */}
                  <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4 shrink-0 justify-center min-h-[140px]">
                    {/* Timers Row */}
                    {(status === "connected" || (status === "idle" && totalSeconds > 0)) && (
                      <div className="flex items-center justify-between border-b border-border pb-3.5 w-full">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Duration</span>
                          <span className="text-lg font-mono font-semibold text-foreground">{formatTime(totalSeconds)}</span>
                        </div>
                        {!isSpeaking && status === "connected" && (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Speaking Turn</span>
                            <span className="text-lg font-mono font-semibold text-accent">
                              {formatTime(currentTurnSeconds)}
                              <span className="text-xs text-muted-foreground font-normal ml-1">
                                / {getTurnLimit(examType, part)}s
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {status === "connecting" && (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <Loader2 className="size-8 animate-spin text-accent" />
                        <span className="text-sm font-medium text-muted-foreground">Connecting to examiner...</span>
                      </div>
                    )}

                    {status === "connected" && (
                      <div className="flex flex-col items-center gap-4 w-full">
                        {/* Action buttons */}
                        <div className="flex gap-4 relative z-10 w-full justify-center">
                          <Button
                            onClick={() => forceTurnCompleteWithInstruction()}
                            variant="secondary"
                            size="lg"
                            className="rounded-full shadow-lg cursor-pointer flex-1 max-w-[160px]"
                            disabled={isSpeaking || isWaitingForModel}
                          >
                            <CheckCircle2 className="mr-2 size-5" /> Done Speaking
                          </Button>
                          <Button
                            onClick={disconnect}
                            variant="destructive"
                            size="lg"
                            className="rounded-full shadow-lg shadow-destructive/20 cursor-pointer flex-1 max-w-[160px]"
                          >
                            <PhoneOff className="mr-2 size-5" /> End Call
                          </Button>
                        </div>

                        {/* Visual indicators */}
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex flex-col items-center">
                            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center relative">
                              <Mic className="size-5 text-primary" />
                              <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full border-2 border-background"></span>
                            </div>
                            <span className="text-xs font-medium mt-1 text-muted-foreground">You</span>
                          </div>

                          <div className="w-12 h-[2px] bg-border relative">
                            <div className="absolute inset-0 bg-primary/50 origin-left animate-pulse pointer-events-none"></div>
                          </div>

                          <div className="flex flex-col items-center">
                            <div
                              className={`size-12 rounded-full flex items-center justify-center relative transition-colors duration-500 ${isSpeaking ? "bg-accent/20" : "bg-muted"}`}
                            >
                              <Sparkles
                                className={`size-5 ${isSpeaking ? "text-accent" : "text-muted-foreground"}`}
                              />
                              {isSpeaking && (
                                <div className="absolute -inset-1 border border-accent/50 rounded-full animate-ping pointer-events-none"></div>
                              )}
                            </div>
                            <span className="text-xs font-medium mt-1 text-muted-foreground">
                              {isSpeaking ? "Speaking..." : "Listening"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {status === "idle" && totalSeconds > 0 && !feedback && (
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-sm font-semibold text-muted-foreground">Call Completed</span>
                        <div className="flex gap-4">
                          <Button
                            onClick={() => connect()}
                            variant="outline"
                            size="lg"
                            className="w-48 h-12 rounded-full text-sm shadow-sm"
                          >
                            <PhoneCall className="mr-3 size-4" /> Start Again
                          </Button>
                          <Button
                            onClick={handleGetEvaluation}
                            disabled={isEvaluating}
                            size="lg"
                            className="w-48 h-12 rounded-full text-sm shadow-lg shadow-accent/20 border-accent text-accent font-semibold"
                          >
                            {isEvaluating ? (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                              <Sparkles className="mr-2 size-4" />
                            )}
                            Get Evaluation
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* When feedback is shown, we stack the Active Prompt and Transcript inside a single vertical flex container */
                <div className="flex-1 flex flex-col gap-6">
                  {/* Active topic description on top */}
                  <div className="bg-card border border-border rounded-xl p-5 shadow-sm shrink-0 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-accent">Active Topic Prompt</span>
                      {status !== "connected" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBackToTopics}
                          className="h-8 text-xs cursor-pointer px-3"
                        >
                          Back to Topics
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-foreground leading-relaxed italic bg-surface/50 border p-3 rounded-lg font-medium">
                      {activeTopicPrompt || `Live Interview session for ${examType.replace("_", " ").toUpperCase()}`}
                    </p>
                  </div>

                  {/* Transcript */}
                  <div className="flex-1 flex flex-col min-h-[300px] bg-surface border border-border rounded-xl shadow-sm">
                    <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Mic className="size-4 text-primary animate-pulse" />
                        Speech Transcript
                      </h3>
                    </div>
                    
                    <div className="flex-1 p-6 flex flex-col gap-4">
                      {transcript.length === 0 && !currentModelText && (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12">
                          <Volume2 className="size-12 mb-3 text-muted-foreground/40 animate-pulse" />
                          <p className="text-sm font-medium">The conversation transcript will appear here.</p>
                        </div>
                      )}

                      {transcript.map((msg, i) => renderTranscriptMessage(msg, i))}

                      {currentModelText && (
                        <div className="flex gap-3 max-w-[85%] animate-pulse">
                          <div className="size-8 rounded-full shrink-0 flex items-center justify-center bg-accent/10 border border-accent/20 text-accent">
                            <Volume2 className="size-4" />
                          </div>
                          <div className="p-3.5 rounded-2xl bg-card border border-border rounded-tl-sm flex flex-col gap-2 shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1 items-center shrink-0">
                                <span className="size-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="size-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="size-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </div>
                              <span className="text-[10px] text-accent font-semibold uppercase tracking-wider">Examiner is speaking...</span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">
                              {currentModelText.replace(/^🔊\s*\[Examiner\s*Voice\s*Response\]\s*$/, "🔊 (Examiner voice response streaming...)")}
                            </p>
                          </div>
                        </div>
                      )}
                      <div ref={transcriptEndRef} />
                    </div>
                  </div>
                </div>
              )}

              {/* Right Side (during call): Live Transcript taking up the rest of the height */}
              {!feedback && !isEvaluating && (
                <div className="flex-1 flex flex-col min-h-[300px] bg-surface border border-border rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Mic className="size-4 text-primary animate-pulse" />
                      Live Speaking Session
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <span className="size-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                      Voice Connected
                    </span>
                  </div>

                  <div className="flex-1 p-6 flex flex-col gap-4">
                    {transcript.length === 0 && !currentModelText && (
                      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12">
                        <Volume2 className="size-12 mb-3 text-muted-foreground/40 animate-pulse" />
                        <p className="text-sm font-medium">The examiner is initiating the session...</p>
                        <p className="text-xs text-muted-foreground/75 mt-1">Speak clearly into your microphone when ready.</p>
                      </div>
                    )}

                    {transcript.map((msg, i) => renderTranscriptMessage(msg, i))}

                    {currentModelText && (
                      <div className="flex gap-3 max-w-[85%] animate-pulse">
                        <div className="size-8 rounded-full shrink-0 flex items-center justify-center bg-accent/10 border border-accent/20 text-accent">
                          <Volume2 className="size-4" />
                        </div>
                        <div className="p-3.5 rounded-2xl bg-card border border-border rounded-tl-sm flex flex-col gap-2 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1 items-center shrink-0">
                              <span className="size-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="size-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="size-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                            <span className="text-[10px] text-accent font-semibold uppercase tracking-wider">Examiner is speaking...</span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {currentModelText.replace(/^🔊\s*\[Examiner\s*Voice\s*Response\]\s*$/, "🔊 (Examiner voice response streaming...)")}
                          </p>
                        </div>
                      </div>
                    )}
                    <div ref={transcriptEndRef} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right Column: AI Feedback Display */}
          {(feedback || isEvaluating) && (
            <div className="lg:w-[450px] shrink-0 pb-6">
              {isEvaluating && !feedback ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Loader2 className="size-10 animate-spin mb-4 text-accent" />
                  <p>Evaluating your performance...</p>
                </div>
              ) : feedback ? (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl border border-accent/20 p-6 flex items-center gap-6 shadow-lg shadow-accent/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Sparkles className="size-24" />
                    </div>
                    <div className="size-20 rounded-full bg-background border-4 border-accent/30 flex items-center justify-center shrink-0 shadow-inner">
                      <span className="text-3xl font-bold tracking-tighter text-accent">
                        {feedback.band_score}
                      </span>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold">Estimated Score</h3>
                      <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                        {feedback.overall}
                      </p>
                    </div>
                  </div>

                  {feedback.criteria_scores && (
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                        <CheckCircle2 className="size-4 text-emerald-500" /> Detailed Assessment
                      </div>
                      <div className="space-y-4">
                        {Object.entries(feedback.criteria_scores).map(
                          ([key, data]: [string, any]) => (
                            <div key={key}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                  {key.replace("_", " ")}
                                </span>
                                <span className="text-xs font-bold text-accent">{data.score}</span>
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed">
                                {data.comment}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-card border border-border rounded-xl p-0 overflow-hidden shadow-sm">
                    <Tabs defaultValue="grammar" className="w-full">
                      <TabsList className="w-full justify-start rounded-none border-b border-border h-12 bg-surface/30 px-2">
                        <TabsTrigger value="grammar" className="data-[state=active]:bg-background">
                          Grammar Fixes
                        </TabsTrigger>
                        <TabsTrigger value="vocab" className="data-[state=active]:bg-background">
                          Vocab Upgrades
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="grammar" className="p-5 m-0 outline-none">
                        {feedback.grammar_issues?.length > 0 ? (
                          <div className="space-y-4">
                            {feedback.grammar_issues.map((issue: any, i: number) => (
                              <div key={i} className="flex gap-3 text-sm">
                                <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                                <div>
                                  <div className="line-through text-destructive/80 mb-0.5">
                                    {issue.original}
                                  </div>
                                  <div className="text-emerald-500 font-medium mb-1">
                                    {issue.correction}
                                  </div>
                                  <div className="text-muted-foreground text-xs">
                                    {issue.explanation}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Great job! No major grammar issues detected.
                          </p>
                        )}
                      </TabsContent>

                      <TabsContent value="vocab" className="p-5 m-0 outline-none">
                        {feedback.vocabulary_suggestions?.length > 0 ? (
                          <div className="space-y-4">
                            {feedback.vocabulary_suggestions.map((sug: any, i: number) => (
                              <div key={i} className="flex gap-3 text-sm">
                                <Sparkles className="size-4 text-accent shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium mb-0.5">
                                    <span className="text-muted-foreground line-through mr-2">
                                      {sug.word}
                                    </span>
                                    <span className="text-accent">{sug.better}</span>
                                  </div>
                                  <div className="text-muted-foreground text-xs">{sug.why}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Your vocabulary was already quite strong!
                          </p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Connection Diagnostics Console */}
        <div className="mt-8 border border-border rounded-xl bg-card overflow-hidden shadow-sm">
          <div 
            onClick={() => setShowDebugConsole(!showDebugConsole)}
            className="flex items-center justify-between px-5 py-3.5 bg-muted/30 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <AlertCircle className="size-4 text-muted-foreground" />
              Connection Diagnostics & Troubleshooting
            </div>
            <span className="text-xs text-accent font-medium">
              {showDebugConsole ? "Hide Diagnostics" : "Show Diagnostics"}
            </span>
          </div>
          {showDebugConsole && (
            <div className="p-5 space-y-4 text-sm bg-surface animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground mb-2">Troubleshooting Steps</h4>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-muted-foreground">
                    <li>
                      <strong>Microphone Permissions:</strong> Verify that your browser has permission to access your microphone. Look for a camera/mic icon in the browser address bar.
                    </li>
                    <li>
                      <strong>API Key Configuration:</strong> The Live Examiner requires the <code>GEMINI_API_KEY</code> environment variable to be configured in your Netlify Dashboard (under <em>Site Configuration &gt; Environment Variables</em>).
                    </li>
                    <li>
                      <strong>HTTPS Required:</strong> Bidirectional media requires a secure context. Make sure you are accessing the site via <code>https://</code> or <code>localhost</code>.
                    </li>
                    <li>
                      <strong>Check Live API:</strong> The connection uses Gemini Live WebSocket API (<code>wss://generativelanguage.googleapis.com</code>). If your network blocks WebSocket traffic, it will not connect.
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground mb-2">Internal Debug Logs</h4>
                  <div className="h-40 rounded-lg border border-border bg-muted/40 p-3 overflow-y-auto font-mono text-[10px] leading-relaxed text-muted-foreground space-y-1">
                    {debugLogs.length === 0 ? (
                      <span className="italic text-muted-foreground/60">No logs generated yet. Start a session to view diagnostics.</span>
                    ) : (
                      debugLogs.map((log, index) => (
                        <div key={index} className="border-b border-muted-foreground/5 pb-1">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
