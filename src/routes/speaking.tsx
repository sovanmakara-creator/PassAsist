import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { analyzeSpeaking, fetchSpeakingTopic } from "@/services/speaking.functions";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Shuffle,
  Mic,
  Square,
  RotateCcw,
} from "lucide-react";
import { z } from "zod";

const SearchSchema = z.object({
  exam: z.enum(["ielts_speaking", "toefl_speaking", "toeic_speaking"]).optional(),
});

export const Route = createFileRoute("/speaking")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "AI Speaking Tutor — PassAssist" },
      {
        name: "description",
        content:
          "Real-time AI feedback on IELTS, TOEFL and TOEIC speaking tasks. Pronunciation, fluency, grammar, vocabulary, and band score.",
      },
    ],
  }),
  component: SpeakingPage,
});

/* ------------------------------------------------------------------ */
/*  Speaking types & time limits per exam                              */
/* ------------------------------------------------------------------ */
const SPEAKING_TYPES: Record<string, { label: string; types: { value: string; label: string }[] }> =
  {
    ielts_speaking: {
      label: "IELTS Speaking",
      types: [
        { value: "part1", label: "Part 1 (Introduction)" },
        { value: "part2", label: "Part 2 (Cue Card)" },
        { value: "part3", label: "Part 3 (Discussion)" },
      ],
    },
    toefl_speaking: {
      label: "TOEFL Speaking",
      types: [{ value: "independent", label: "Independent Task" }],
    },
    toeic_speaking: {
      label: "TOEIC Speaking",
      types: [
        { value: "read_text", label: "Read a Text Aloud" },
        { value: "describe_picture", label: "Describe a Picture" },
        { value: "respond_to_questions", label: "Respond to Questions" },
        { value: "express_opinion", label: "Express an Opinion" },
      ],
    },
  };

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SpeakingPage() {
  const search = Route.useSearch();
  const exam = search.exam ?? "ielts_speaking";

  const config = SPEAKING_TYPES[exam];
  const [activeType, setActiveType] = useState(config.types[0].value);

  const [taskText, setTaskText] = useState("");
  const [isFetchingTask, setIsFetchingTask] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mimeTypeRef = useRef<string>("audio/webm");

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  const handleGetNewTopic = async () => {
    setIsFetchingTask(true);
    setAudioBlob(null);
    setAudioUrl(null);
    setFeedback(null);
    try {
      const res = await fetchSpeakingTopic({ data: { exam, part: activeType } });
      setTaskText(res.task);
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch topic");
    } finally {
      setIsFetchingTask(false);
    }
  };

  useEffect(() => {
    handleGetNewTopic();
  }, [exam, activeType]);

  // Audio Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/mp4"; // Fallback for Safari
      }
      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((track) => track.stop()); // Stop mic
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setFeedback(null);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Could not access microphone. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setFeedback(null);
  };

  // Convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async () => {
    if (!audioBlob) {
      toast.error("Please record an audio response first.");
      return;
    }

    setIsEvaluating(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const fb = await analyzeSpeaking({
        data: {
          exam,
          task: taskText,
          audioBase64: base64Audio,
          mimeType: mimeTypeRef.current,
        },
      });
      setFeedback(fb);
      toast.success("Evaluation complete!");
    } catch (e: any) {
      console.error("Evaluation error:", e);
      toast.error(e.message || "Something went wrong.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-6 h-full">
        <PageHeader
          title="AI Speaking Tutor"
          description="Practice speaking tasks with instant examiner-grade feedback on pronunciation, fluency, and grammar."
        >
          <ShareButton
            title="AI Speaking Tutor — PassAssist"
            description="Practice speaking and get instant examiner-grade feedback in real-time."
          />
        </PageHeader>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Task & Recording */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <Tabs value={activeType} onValueChange={setActiveType}>
                <TabsList className="h-10 bg-surface/50 border border-border/50 p-1">
                  {config.types.map((t) => (
                    <TabsTrigger
                      key={t.value}
                      value={t.value}
                      className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                    >
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Prompt Box */}
            <div className="bg-card border border-border rounded-xl p-5 relative min-h-[160px] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-accent font-medium text-sm">
                  <BookOpen className="size-4" /> Prompt
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGetNewTopic}
                  disabled={isFetchingTask}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <Shuffle className={`size-3.5 mr-1.5 ${isFetchingTask ? "animate-spin" : ""}`} />
                  New Prompt
                </Button>
              </div>

              {isFetchingTask ? (
                <div className="flex flex-col gap-2 animate-pulse">
                  <div className="h-4 bg-muted/60 rounded w-full" />
                  <div className="h-4 bg-muted/60 rounded w-5/6" />
                  <div className="h-4 bg-muted/60 rounded w-4/6" />
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 whitespace-pre-wrap">
                  {taskText}
                </div>
              )}
            </div>

            {/* Audio Recorder */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[250px] gap-6">
              {/* Visualizer / Timer */}
              <div className="text-center flex flex-col items-center">
                {isRecording ? (
                  <>
                    <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4 animate-pulse">
                      <div className="size-12 rounded-full bg-destructive flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                        <Mic className="size-6 text-destructive-foreground" />
                      </div>
                    </div>
                    <div className="text-3xl font-mono text-destructive tracking-wider font-light">
                      {formatTime(recordingTime)}
                    </div>
                  </>
                ) : audioUrl ? (
                  <>
                    <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="size-10 text-emerald-500" />
                    </div>
                    <div className="text-lg font-medium">Recording saved</div>
                    <div className="text-sm text-muted-foreground mt-1 font-mono">
                      Length: {formatTime(recordingTime)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                      <Mic className="size-8" />
                    </div>
                    <div className="text-lg font-medium">Ready to record</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Press start when you are ready to speak.
                    </div>
                  </>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {isRecording ? (
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="lg"
                    className="w-32 shadow-lg shadow-destructive/20"
                  >
                    <Square className="size-4 mr-2 fill-current" /> Stop
                  </Button>
                ) : audioUrl ? (
                  <div className="flex items-center gap-2">
                    <Button onClick={resetRecording} variant="outline" size="icon" title="Rerecord">
                      <RotateCcw className="size-4" />
                    </Button>
                    <audio
                      src={audioUrl}
                      controls
                      className="h-10 w-64 grayscale contrast-125 mx-2"
                    />
                  </div>
                ) : (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="w-32 shadow-lg shadow-primary/20"
                  >
                    <Mic className="size-4 mr-2" /> Start
                  </Button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSubmit}
                disabled={isEvaluating || !audioBlob || isRecording}
                size="lg"
                className="w-full sm:w-auto relative overflow-hidden group shadow-lg shadow-accent/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-white/10 to-accent/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {isEvaluating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI Examiner listening...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Evaluate Speaking
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: Feedback */}
          <div className="lg:w-[450px] shrink-0">
            {feedback ? (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Score Card */}
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
                    <h3 className="text-lg font-bold">Estimated Band Score</h3>
                    <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                      {feedback.overall}
                    </p>
                  </div>
                </div>

                {/* Transcript */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                    <Mic className="size-4 text-primary" /> What you said (Transcript)
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-sm text-foreground/90 italic border border-border/50">
                    "{feedback.transcript}"
                  </div>
                </div>

                {/* Detailed Criteria Scores */}
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

                {/* Fixes & Upgrades */}
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
            ) : (
              <div className="h-full min-h-[400px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-surface/10">
                <Mic className="size-12 mb-4 opacity-20" />
                <h3 className="font-medium text-lg text-foreground/70 mb-2">Awaiting Recording</h3>
                <p className="text-sm max-w-[250px]">
                  Record your answer to the prompt on the left to receive AI grading and detailed
                  feedback.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
