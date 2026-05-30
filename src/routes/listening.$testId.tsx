import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  HelpCircle,
  MessageSquare,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { LISTENING_TESTS } from "@/services/listening-data";
import { getQuestionClue, getAnswerExplanation } from "@/services/gemini.functions";
import { z } from "zod";
import { ShareButton } from "@/components/share-button";

const TestSearchSchema = z.object({
  from: z.string().optional(),
});

export const Route = createFileRoute("/listening/$testId")({
  validateSearch: (s) => TestSearchSchema.parse(s),
  component: ListeningTestPage,
});

function ListeningTestPage() {
  const { testId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const testData = LISTENING_TESTS.find((t) => t.id === testId);

  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Timer state (40 minutes)
  const [timeLeft, setTimeLeft] = useState(40 * 60);

  // Clues and Explanations state
  const [clues, setClues] = useState<Record<string, { loading: boolean; text?: string }>>({});
  const [explanations, setExplanations] = useState<
    Record<string, { loading: boolean; text?: string }>
  >({});

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setTimeLeft(40 * 60);
    setClues({});
    setExplanations({});
  }, [testId]);

  useEffect(() => {
    if (submitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, timeLeft]);

  if (!testData) {
    return (
      <AppShell>
        <div className="max-w-screen-2xl mx-auto px-6 py-10 flex flex-col items-center justify-center h-[calc(100vh-64px)]">
          <h1 className="text-2xl font-bold mb-4">Test not found</h1>
          <Button onClick={() => navigate({ to: "/listening" })}>Go back to tests</Button>
        </div>
      </AppShell>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleInputChange = (id: string, val: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [id]: val }));
  };

  const calculateScore = () => {
    let currentScore = 0;
    Object.keys(testData.answers).forEach((key) => {
      const userAns = answers[key];
      const correctAns = testData.answers[key];

      if (typeof correctAns === "string" && typeof userAns === "string") {
        if (userAns.trim().toLowerCase() === correctAns.toLowerCase()) {
          currentScore++;
        }
      } else if (userAns === correctAns) {
        currentScore++;
      }
    });
    setScore(currentScore);
    setSubmitted(true);
    toast.success(`You scored ${currentScore} out of ${Object.keys(testData.answers).length}`);
  };

  const isAnswerCorrect = (id: string) => {
    const userAns = answers[id];
    const correctAns = testData.answers[id];
    if (typeof correctAns === "string" && typeof userAns === "string") {
      return userAns.trim().toLowerCase() === correctAns.toLowerCase();
    }
    return userAns === correctAns;
  };

  const getFeedbackIcon = (id: string) => {
    if (!submitted) return null;
    return isAnswerCorrect(id) ? (
      <CheckCircle2 className="size-4 text-emerald-500 inline-block ml-2" />
    ) : (
      <XCircle className="size-4 text-destructive inline-block ml-2" />
    );
  };

  const handleGetClue = async (qId: string, questionText: string) => {
    if (clues[qId]?.text || clues[qId]?.loading) return;
    setClues((prev) => ({ ...prev, [qId]: { loading: true } }));
    try {
      const result = await getQuestionClue({
        data: {
          context:
            "IELTS Listening Test audio track. (Audio not attached, please provide a logical hint based on the question context).",
          question: questionText,
        },
      });
      setClues((prev) => ({ ...prev, [qId]: { loading: false, text: result.clue } }));
    } catch (err) {
      setClues((prev) => ({ ...prev, [qId]: { loading: false, text: "Failed to load clue." } }));
      toast.error("Failed to load clue");
    }
  };

  const handleGetExplanation = async (qId: string, questionText: string) => {
    if (explanations[qId]?.text || explanations[qId]?.loading) return;
    setExplanations((prev) => ({ ...prev, [qId]: { loading: true } }));
    try {
      const result = await getAnswerExplanation({
        data: {
          context: "IELTS Listening Test audio track. (Audio not attached).",
          question: questionText,
          correctAnswer: String(testData.answers[qId]),
          userAnswer: String(answers[qId] || "No answer provided"),
        },
      });
      setExplanations((prev) => ({ ...prev, [qId]: { loading: false, text: result.explanation } }));
    } catch (err) {
      setExplanations((prev) => ({
        ...prev,
        [qId]: { loading: false, text: "Failed to load explanation." },
      }));
      toast.error("Failed to load explanation");
    }
  };

  const renderClueAndExplanation = (qId: string, questionText: string) => {
    return (
      <div className="mt-2 mb-4 text-sm flex flex-col gap-2 w-full max-w-lg ml-4">
        {!submitted && (
          <div>
            {!clues[qId]?.text && !clues[qId]?.loading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleGetClue(qId, questionText)}
                className="text-xs h-7 text-muted-foreground"
              >
                <HelpCircle className="size-3.5 mr-1.5" /> Need a hint?
              </Button>
            )}
            {clues[qId]?.loading && (
              <span className="text-xs text-muted-foreground flex items-center">
                <Loader2 className="size-3 animate-spin mr-1" /> Generating hint...
              </span>
            )}
            {clues[qId]?.text && (
              <div className="bg-accent/10 border border-accent/20 p-2 rounded-md text-accent text-xs">
                <span className="font-bold">Hint:</span> {clues[qId].text}
              </div>
            )}
          </div>
        )}

        {submitted && !isAnswerCorrect(qId) && (
          <div>
            {!explanations[qId]?.text && !explanations[qId]?.loading && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGetExplanation(qId, questionText)}
                className="text-xs h-7"
              >
                <MessageSquare className="size-3.5 mr-1.5" /> Explain answer
              </Button>
            )}
            {explanations[qId]?.loading && (
              <span className="text-xs text-muted-foreground flex items-center">
                <Loader2 className="size-3 animate-spin mr-1" /> Analyzing...
              </span>
            )}
            {explanations[qId]?.text && (
              <div className="bg-primary/5 border border-primary/10 p-3 rounded-md text-foreground/90 text-sm leading-relaxed">
                <span className="font-bold text-primary">Explanation:</span>{" "}
                {explanations[qId].text}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <AppShell>
      <div className="max-w-screen-xl mx-auto px-6 py-10 min-h-[calc(100vh-64px)] flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (search.from) {
                  navigate({ to: search.from });
                } else {
                  navigate({ to: "/listening" });
                }
              }}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <PageHeader
              eyebrow="Listening Practice"
              title={testData.title}
              description="Play the audio track and answer the questions below."
            >
              <ShareButton
                title={`${testData.title} — PassAsistant Listening`}
                description={testData.subtitle || "Practice listening comprehension with real-time AI assistance."}
              />
            </PageHeader>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-xl shadow-sm">
            <Timer
              className={`size-5 ${timeLeft < 300 ? "text-destructive animate-pulse" : "text-muted-foreground"}`}
            />
            <span
              className={`text-xl font-bold tabular-nums tracking-tight ${timeLeft < 300 ? "text-destructive" : ""}`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* AUDIO PLAYER */}
        <div className="sticky top-4 z-10 bg-card rounded-2xl border border-border p-6 shadow-sm mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-semibold text-lg">{testData.title} Audio</div>
          <audio controls className="w-full max-w-lg" src={testData.audioSrc}>
            Your browser does not support the audio element.
          </audio>
        </div>

        {/* QUESTIONS AREA */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm flex-1">
          <div className="space-y-12">
            {testData.sections.map((section, sIdx) => {
              if (section.type === "fill-in") {
                const data = section.data as any;
                return (
                  <section key={sIdx}>
                    <div className="mb-6">
                      <h3 className="font-bold text-xl mb-2">{section.title}</h3>
                      <p className="text-muted-foreground italic font-medium">
                        {section.instructions}
                      </p>
                    </div>

                    <div className="space-y-8 pl-4 border-l-2 border-muted">
                      {data.fields.map((field: any, fIdx: number) => (
                        <div key={fIdx} className="space-y-4">
                          <h4 className="font-bold text-lg text-accent underline underline-offset-4 decoration-accent/30">
                            {field.heading}
                          </h4>
                          <ul className="space-y-4 list-disc list-inside ml-2">
                            {field.lines.map((line: any, lIdx: number) => {
                              const lineText = line.textParts.join("___");
                              return (
                                <li key={lIdx} className="leading-loose text-[15px]">
                                  {line.textParts.map((part: string, pIdx: number) => {
                                    const inputDef = line.inputs[pIdx];
                                    if (!inputDef) {
                                      return <span key={pIdx}>{part}</span>;
                                    }

                                    const qId = inputDef.id;
                                    return (
                                      <span key={pIdx}>
                                        {part}
                                        <span className="inline-flex flex-col">
                                          <span className="inline-flex items-center gap-1 mx-1">
                                            <span className="font-semibold text-xs text-muted-foreground">
                                              [{qId}]
                                            </span>
                                            <Input
                                              value={(answers[qId] as string) || ""}
                                              onChange={(e) =>
                                                handleInputChange(qId, e.target.value)
                                              }
                                              className="w-40 h-8 inline-block px-3 py-1 bg-muted/50 border-muted-foreground/30 focus-visible:ring-accent uppercase"
                                              disabled={submitted}
                                            />
                                            {getFeedbackIcon(qId)}
                                            {submitted && !isAnswerCorrect(qId) && (
                                              <span className="text-emerald-500 text-sm font-semibold ml-1">
                                                ({String(testData.answers[qId]).toUpperCase()})
                                              </span>
                                            )}
                                          </span>
                                        </span>
                                      </span>
                                    );
                                  })}
                                  {/* Render clues/explanations directly below the line if it has inputs */}
                                  {line.inputs.map((inputDef: any) =>
                                    renderClueAndExplanation(
                                      inputDef.id,
                                      `Fill in the blank for sentence: ${lineText}`,
                                    ),
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }
              return null;
            })}
          </div>

          <div className="mt-12 pt-6 border-t border-border flex justify-between items-center bg-background">
            {submitted ? (
              <div className="text-2xl font-bold">
                Score: <span className="text-accent">{score}</span> /{" "}
                {Object.keys(testData.answers).length}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Make sure you have answered all questions before submitting.
              </div>
            )}

            <Button
              onClick={calculateScore}
              disabled={submitted}
              size="lg"
              className="w-48 text-base"
            >
              Submit Answers
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
