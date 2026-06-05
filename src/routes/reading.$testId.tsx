import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  HelpCircle,
  MessageSquare,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDictionaryDefinition,
  getQuestionClue,
  getAnswerExplanation,
} from "@/services/gemini.functions";
import { READING_TESTS } from "@/services/reading-data";
import { progressTracker } from "@/services/progress-tracker";
import { z } from "zod";
import { ShareButton } from "@/components/share-button";

const TestSearchSchema = z.object({
  from: z.string().optional(),
});

export const Route = createFileRoute("/reading/$testId")({
  validateSearch: (s) => TestSearchSchema.parse(s),
  component: ReadingTestPage,
});

function ClickableWord({ word, sentence }: { word: string; sentence: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [definition, setDefinition] = useState<{
    word: string;
    phonetic: string;
    partOfSpeech: string;
    definition: string;
    example: string;
  } | null>(null);

  const cleanWord = word.replace(/^[^\w]+|[^\w]+$/g, "");

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !definition && cleanWord.length > 0) {
      setLoading(true);
      try {
        const result = await getDictionaryDefinition({
          data: { word: cleanWord, contextSentence: sentence },
        });
        setDefinition(result);
      } catch (err) {
        toast.error("Failed to load definition");
      } finally {
        setLoading(false);
      }
    }
  };

  if (cleanWord.length === 0) {
    return <span>{word}</span>;
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <span className="cursor-pointer hover:bg-accent/20 hover:text-accent transition-colors rounded px-[2px] -mx-[2px]">
          {word}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start" sideOffset={6}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="size-6 animate-spin text-accent mb-2" />
            <p className="text-sm text-muted-foreground">Looking up definition...</p>
          </div>
        ) : definition ? (
          <div className="space-y-3">
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <h4 className="text-lg font-bold text-foreground">{definition.word}</h4>
                <span className="text-sm text-muted-foreground">{definition.phonetic}</span>
              </div>
              <span className="inline-block px-2 py-0.5 rounded bg-accent/10 text-[11px] font-semibold uppercase tracking-wider text-accent">
                {definition.partOfSpeech}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{definition.definition}</p>
            <div className="bg-muted/50 p-3 rounded-md border border-border/50">
              <p className="text-sm italic text-muted-foreground">"{definition.example}"</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-destructive">Could not find definition.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ClickableParagraph({ text }: { text: string }) {
  const tokens = text.split(/(\s+)/);
  return (
    <p>
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) {
          return <span key={i}>{token}</span>;
        }
        return <ClickableWord key={i} word={token} sentence={text} />;
      })}
    </p>
  );
}

function ReadingTestPage() {
  const { testId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const testData = READING_TESTS.find((t) => t.id === testId);

  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Timer state (60 minutes)
  const [timeLeft, setTimeLeft] = useState(60 * 60);

  // Clues and Explanations state
  const [clues, setClues] = useState<Record<string, { loading: boolean; text?: string }>>({});
  const [explanations, setExplanations] = useState<
    Record<string, { loading: boolean; text?: string }>
  >({});

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setTimeLeft(60 * 60);
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
          <Button onClick={() => navigate({ to: "/reading" })}>Go back to tests</Button>
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

  const handleInputChange = (id: string, val: string | number) => {
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
    progressTracker.saveReadingScore(testId, currentScore, Object.keys(testData.answers).length);
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
          context: testData.paragraphs.join("\n"),
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
          context: testData.paragraphs.join("\n"),
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
      <div className="mt-2 text-sm flex flex-col gap-2 w-full max-w-lg">
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
      <div className="max-w-screen-2xl mx-auto px-6 py-10 h-[calc(100vh-64px)] flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (search.from) {
                  navigate({ to: search.from });
                } else {
                  navigate({ to: "/reading" });
                }
              }}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <PageHeader
              eyebrow="Reading Practice"
              title={testData.title}
              description="Read the passage and answer the questions. Click any word for a definition."
            >
              <ShareButton
                title={`${testData.title} — PassAssist Reading`}
                description={testData.subtitle || "Practice reading comprehension with real-time AI assistance."}
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

        <div className="grid lg:grid-cols-2 gap-8 flex-1 min-h-0">
          {/* PASSAGE PANE */}
          <div className="rounded-2xl border border-border bg-card p-8 overflow-y-auto shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight mb-2 text-center text-accent">
              {testData.title}
            </h1>
            <p className="text-center italic text-muted-foreground mb-8">{testData.subtitle}</p>

            <div className="space-y-6 text-foreground/90 leading-relaxed text-[15px]">
              {testData.paragraphs.map((p, i) => (
                <ClickableParagraph key={i} text={p} />
              ))}
            </div>
          </div>

          {/* QUESTIONS PANE */}
          <div className="rounded-2xl border border-border bg-card p-8 overflow-y-auto shadow-sm flex flex-col">
            <div className="space-y-10 flex-1">
              {testData.sections.map((section, sIdx) => {
                if (section.type === "summary") {
                  const data = section.data as { startNumber: number; text: string[] };
                  return (
                    <section key={sIdx}>
                      <div className="mb-4">
                        <h3 className="font-bold text-lg mb-1">{section.title}</h3>
                        <p className="text-sm text-muted-foreground italic">
                          {section.instructions}
                        </p>
                      </div>
                      <div className="bg-muted/30 p-5 rounded-xl border border-border text-[15px] leading-loose whitespace-pre-wrap flex flex-col gap-4">
                        {data.text.map((textPiece, i) => {
                          const qId = String(data.startNumber + i);
                          const isLast = i === data.text.length - 1;
                          const contextQuestion = `Fill in the blank for sentence: ${textPiece}...`;
                          return (
                            <div key={i}>
                              <span>
                                {textPiece}
                                {!isLast && (
                                  <span className="inline-flex items-center gap-1 mx-1">
                                    <span className="font-semibold text-xs text-muted-foreground">
                                      [{qId}]
                                    </span>
                                    <Input
                                      value={(answers[qId] as string) || ""}
                                      onChange={(e) => handleInputChange(qId, e.target.value)}
                                      className="w-32 h-8 inline-block px-2 py-1 text-center uppercase"
                                      disabled={submitted}
                                    />
                                    {getFeedbackIcon(qId)}
                                    {submitted && !isAnswerCorrect(qId) && (
                                      <span className="text-emerald-500 text-xs font-semibold ml-1">
                                        ({String(testData.answers[qId]).toUpperCase()})
                                      </span>
                                    )}
                                  </span>
                                )}
                              </span>
                              {!isLast && renderClueAndExplanation(qId, contextQuestion)}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                }

                if (section.type === "mcq") {
                  const data = section.data as { questions: any[] };
                  return (
                    <section key={sIdx}>
                      <div className="mb-4">
                        <h3 className="font-bold text-lg mb-1">{section.title}</h3>
                        <p className="text-sm text-muted-foreground italic">
                          {section.instructions}
                        </p>
                      </div>
                      <div className="space-y-8">
                        {data.questions.map((q) => {
                          const questionContext = `${q.question}\nOptions: ${q.options.join(", ")}`;
                          return (
                            <div key={q.id}>
                              <p className="font-medium mb-3">
                                {q.id}. {q.question} {getFeedbackIcon(q.id)}
                              </p>
                              <RadioGroup
                                value={
                                  answers[q.id] !== undefined ? String(answers[q.id]) : undefined
                                }
                                onValueChange={(v) => handleInputChange(q.id, parseInt(v))}
                                disabled={submitted}
                                className="space-y-2 ml-4 mb-2"
                              >
                                {q.options.map((opt: string, i: number) => {
                                  const correctIndex = testData.answers[q.id] as number;
                                  const isCorrectOpt = submitted && i === correctIndex;
                                  const isSelectedIncorrect =
                                    submitted && answers[q.id] === i && i !== correctIndex;

                                  return (
                                    <div
                                      key={i}
                                      className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${isCorrectOpt ? "bg-emerald-500/10 border border-emerald-500/20" : isSelectedIncorrect ? "bg-destructive/10 border border-destructive/20" : ""}`}
                                    >
                                      <RadioGroupItem value={String(i)} id={`q${q.id}-opt${i}`} />
                                      <Label
                                        htmlFor={`q${q.id}-opt${i}`}
                                        className={`cursor-pointer font-normal ${isCorrectOpt ? "font-semibold text-emerald-600" : ""}`}
                                      >
                                        <span className="font-bold mr-2">
                                          {String.fromCharCode(65 + i)}
                                        </span>
                                        {opt}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </RadioGroup>
                              {renderClueAndExplanation(q.id, questionContext)}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                }

                if (section.type === "matching" || section.type === "matching_info") {
                  const data = section.data as { options: any[]; questions: any[] };
                  return (
                    <section key={sIdx}>
                      <div className="mb-4">
                        <h3 className="font-bold text-lg mb-1">{section.title}</h3>
                        <p className="text-sm text-muted-foreground italic">
                          {section.instructions}
                        </p>
                      </div>
                      <div className="bg-muted/30 p-5 rounded-xl border border-border mb-6">
                        <ul className="space-y-2 text-sm">
                          {data.options.map((opt) => (
                            <li key={opt.value} className="flex gap-3">
                              <span className="font-bold text-accent">{opt.value}</span>
                              <span>{opt.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-6">
                        {data.questions.map((q) => {
                          const questionContext = `Match this: ${q.prompt} with options: ${data.options.map((o) => `${o.value}: ${o.label}`).join(", ")}`;
                          return (
                            <div key={q.id}>
                              <div className="flex items-center gap-4 mb-2">
                                <span className="w-8 text-right font-medium">{q.id}.</span>
                                <p className="flex-1 text-sm">{q.prompt}</p>
                                <Select
                                  value={(answers[q.id] as string) || ""}
                                  onValueChange={(v) => handleInputChange(q.id, v)}
                                  disabled={submitted}
                                >
                                  <SelectTrigger className="w-[80px]">
                                    <SelectValue placeholder="-" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {data.options.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.value}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {getFeedbackIcon(q.id)}
                                {submitted && answers[q.id] !== testData.answers[q.id] && (
                                  <span className="text-emerald-500 text-xs font-semibold w-8 text-center">
                                    {testData.answers[q.id]}
                                  </span>
                                )}
                              </div>
                              <div className="ml-12">
                                {renderClueAndExplanation(q.id, questionContext)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                }

                return null;
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-border flex justify-between items-center bg-background sticky bottom-0">
              {submitted ? (
                <div className="text-xl font-bold">
                  Score: <span className="text-accent">{score}</span> /{" "}
                  {Object.keys(testData.answers).length}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Make sure you have answered all questions.
                </div>
              )}

              <Button onClick={calculateScore} disabled={submitted} size="lg" className="w-40">
                Submit Answers
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
