import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, List, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { ShareButton } from "@/components/share-button";

const CourseSearchSchema = z.object({
  from: z.string().optional(),
});

interface Chapter {
  id: string;
  title: string;
  page: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  audioUrl?: string;
  chapters: Chapter[];
}

const COURSES: Record<string, Course> = {
  "ielts-mock-secrets": {
    id: "ielts-mock-secrets",
    title: "Secrets to IELTS Success: Band 8",
    description: "An IELTS expert's guide to the IELTS test by Nerada Turner.",
    pdfUrl: "/resources/ielts/secrets-to-ielts-success-band-8.pdf",
    chapters: [
      { id: "ch1", title: "About the Test", page: 4 },
      { id: "ch2", title: "The Writing Module - Task 2", page: 5 },
      { id: "ch3", title: "Essay Band Descriptors", page: 9 },
      { id: "ch4", title: "The Writing Module - Task 1", page: 13 },
      { id: "ch5", title: "Letter Writing", page: 18 },
      { id: "ch6", title: "The Speaking Module", page: 24 },
      { id: "ch7", title: "The Listening Module", page: 30 },
      { id: "ch8", title: "Listening Tips", page: 33 },
      { id: "ch9", title: "The Reading Module", page: 36 },
      { id: "ch10", title: "Reading Question Types", page: 41 },
      { id: "ch11", title: "Coda", page: 46 }
    ]
  },
  "helpful-1": {
    id: "helpful-1",
    title: "1000+ Phrasal Verbs with meanings and sentences",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/1000-phrasal-verbs-with-meanings-and-sentences.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-2": {
    id: "helpful-2",
    title: "130 common mistakes in English",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/130-common-mistakes-in-english.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-3": {
    id: "helpful-3",
    title: "49 Easy English Conversation Dialogues",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/49-easy-english-conversation-dialogues-for-beginners-in.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-4": {
    id: "helpful-4",
    title: "49 English Conversation Topics",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/49-english-conversation-topics.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-5": {
    id: "helpful-5",
    title: "500 Words, Phrases, Idioms for TOEFL",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/500-words-phrases-idioms-for-the-toefl-cam-edu.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-6": {
    id: "helpful-6",
    title: "501 Critical Reading Questions",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/501-critical-reading-questions.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-7": {
    id: "helpful-7",
    title: "501 Sentence Completion Questions",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/501-sentence-completion-questions.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-8": {
    id: "helpful-8",
    title: "501 Synonym and Antonym Questions",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/501-synonym-and-antonym-questions.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-9": {
    id: "helpful-9",
    title: "Advanced English Conversation Dialogues",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/advanced-english-conversation-dialogues-speak-english-like.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-10": {
    id: "helpful-10",
    title: "Advanced English Conversations",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/advanced-english-conversations-speak-english-like-a-native.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-11": {
    id: "helpful-11",
    title: "Advanced English Dialogues",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/advanced-english-dialogues-stories-vocabulary.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-12": {
    id: "helpful-12",
    title: "Collins common errors in English",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/collins-common-errors-in-english-and-how-to-avoid-them.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-13": {
    id: "helpful-13",
    title: "Grammar for everyone",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/grammar-for-everyone-practical-tools-for-learning.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-14": {
    id: "helpful-14",
    title: "Great Debates for ESL-EFL",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/great-debates-for-esl-efl-39-important-debating-topics.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-15": {
    id: "helpful-15",
    title: "Perfect Phrases for ESL",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/perfect-phrases-for-esl-conversational-skills.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-16": {
    id: "helpful-16",
    title: "Shortcut To English Collocations",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/shortcut-to-english-collocations-master-2000-english.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-17": {
    id: "helpful-17",
    title: "Slang & Informal English",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/slang-informal-english.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-18": {
    id: "helpful-18",
    title: "Spoken English in Dialogues",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/spoken-english-in-dialogues-833-common-english-sentences.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "helpful-19": {
    id: "helpful-19",
    title: "Spoken English - Real life Phrases",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/spoken-english-real-life-phrases-and-sentences.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "ielts-l-local1": {
    id: "ielts-l-local1",
    title: "GEP 11B Unit 5 Listening Quiz",
    description: "Listening quiz resource from GEP 11B Unit 5.",
    pdfUrl: "/resources/listening/gep-11b-unit-5-listening-quiz.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "ielts-r-local1": {
    id: "ielts-r-local1",
    title: "GEP 11B Unit 5 Reading Quiz",
    description: "Reading quiz resource from GEP 11B Unit 5.",
    pdfUrl: "/resources/reading/gep-11b-unit-5-reading-quiz.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "ielts-r-local2": {
    id: "ielts-r-local2",
    title: "GEP 11B Unit 6 Reading Quiz",
    description: "Reading quiz resource from GEP 11B Unit 6.",
    pdfUrl: "/resources/reading/gep-11b-unit-6-reading-quiz.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "ielts-r-local3": {
    id: "ielts-r-local3",
    title: "GEP 11B Unit 7 Reading Quiz",
    description: "Reading quiz resource from GEP 11B Unit 7.",
    pdfUrl: "/resources/reading/gep-11b-unit-7-reading-quiz.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "ielts-r-local4": {
    id: "ielts-r-local4",
    title: "RFI PT2 Reading",
    description: "RFI Part 2 Reading practice resource.",
    pdfUrl: "/resources/reading/rfi-pt2-reading-v2.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "ielts-r-local5": {
    id: "ielts-r-local5",
    title: "IELTS Reading Strategies — Ultimate Guide",
    description: "The ultimate guide to IELTS reading strategies with tips and practice exercises.",
    pdfUrl: "/resources/ielts/ielts-reading-strategies-guide.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "ielts-r-local6": {
    id: "ielts-r-local6",
    title: "Reading Keywords — IELTS 13",
    description: "Key vocabulary and keywords from IELTS Cambridge 13 reading passages.",
    pdfUrl: "/resources/ielts/reading-keywords-ielts-13.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "ielts-s-local1": {
    id: "ielts-s-local1",
    title: "IELTS Speaking Sample Answers",
    description: "Collection of sample speaking answers for common IELTS speaking topics.",
    pdfUrl: "/resources/ielts/ielts-speaking-sample-answer.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "ielts-s-local2": {
    id: "ielts-s-local2",
    title: "IELTS Speaking Strategies — Ultimate Guide",
    description: "The ultimate guide to IELTS speaking strategies with tips and practice exercises.",
    pdfUrl: "/resources/ielts/ielts-speaking-strategies-guide.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "toefl-w-local1": {
    id: "toefl-w-local1",
    title: "Ace the TOEFL Essay (TWE)",
    description: "Everything you need to ace the TOEFL essay with strategies and sample responses.",
    pdfUrl: "/resources/toefl/ace-the-toefl-essay.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  },
  "toeic-lr-local1": {
    id: "toeic-lr-local1",
    title: "Tactics for TOEIC — Listening & Reading",
    description: "Comprehensive tactics guide for TOEIC Listening and Reading test sections.",
    pdfUrl: "/resources/toeic/tactics-for-toeic-listening-reading.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }]
  }
};

export const Route = createFileRoute("/courses/$courseId")({
  validateSearch: (s) => CourseSearchSchema.parse(s),
  head: ({ loaderData }) => {
    const course = loaderData?.course;
    return {
      meta: [
        {
          title: course ? `${course.title} — PassAsistant` : "Course — PassAsistant"
        }
      ]
    };
  },
  loader: async ({ params }): Promise<{ courseId: string; course: Course }> => {
    try {
      const { data: courseData, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", params.courseId)
        .maybeSingle();

      if (error) {
        console.error("[Course Loader] courses query error:", error);
      }

      if (courseData && !error) {
        return {
          courseId: params.courseId,
          course: {
            id: courseData.id,
            title: courseData.title,
            description: courseData.description || "",
            pdfUrl: courseData.pdf_url || "",
            audioUrl: courseData.audio_url || undefined,
            chapters: (courseData.chapters_json as Chapter[]) || []
          }
        };
      }

      const { data: resourceData, error: resourceError } = await supabase
        .from("resources")
        .select("*")
        .eq("id", params.courseId)
        .maybeSingle();

      if (resourceError) {
        console.error("[Course Loader] resources query error:", resourceError);
      }

      if (resourceData && !resourceError && resourceData.url?.endsWith(".pdf")) {
        return {
          courseId: params.courseId,
          course: {
            id: resourceData.id,
            title: resourceData.title,
            description: resourceData.description || "",
            pdfUrl: resourceData.url,
            audioUrl: resourceData.audio_url || undefined,
            chapters: [
              {
                id: "ch1",
                title: "Document Start",
                page: 1
              }
            ]
          }
        };
      }
    } catch (err) {
      console.warn("Failed to fetch from Supabase, falling back to static data:", err);
    }

    if (params.courseId in COURSES) {
      return {
        courseId: params.courseId,
        course: COURSES[params.courseId]
      };
    }

    throw notFound();
  },
  component: CourseViewer
});

function CourseViewer() {
  const { course } = Route.useLoaderData();
  const search = Route.useSearch();
  
  const getDefaultFromPath = () => {
    if (course.id.startsWith("helpful-") || course.pdfUrl.includes("/helpful/")) return "/helpful";
    if (course.id.startsWith("ielts-") || course.pdfUrl.includes("/ielts/")) return "/exams/ielts";
    if (course.id.startsWith("toefl-") || course.pdfUrl.includes("/toefl/")) return "/exams/toefl";
    if (course.id.startsWith("toeic-") || course.pdfUrl.includes("/toeic/")) return "/exams/toeic";
    return "/exams/ielts";
  };

  const fromPath = search.from || getDefaultFromPath();
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(course.chapters[0] || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState("");

  useEffect(() => {
    if (course.chapters.length > 0) {
      setActiveChapter(course.chapters[0]);
    } else {
      setActiveChapter(null);
    }

    async function resolvePdfUrl() {
      let rawUrl = course.pdfUrl;
      if (!rawUrl) return;

      if (rawUrl.startsWith("resources/")) {
        rawUrl = "/" + rawUrl;
      } else if (
        rawUrl.match(/^(helpful|ielts|listening|reading|toefl|toeic)\//) &&
        !/\d{13}-/.test(rawUrl)
      ) {
        rawUrl = "/resources/" + rawUrl;
      }

      if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://") || rawUrl.startsWith("/")) {
        setPdfUrl(rawUrl);
      } else {
        const { data, error } = await supabase.storage
          .from("pdfs")
          .createSignedUrl(rawUrl, 3600);

        if (!error && data?.signedUrl) {
          setPdfUrl(data.signedUrl);
        } else {
          console.error("Failed to create signed URL:", error);
          const { data: publicUrlData } = supabase.storage
            .from("pdfs")
            .getPublicUrl(rawUrl);
          setPdfUrl(publicUrlData.publicUrl);
        }
      }
    }

    async function resolveAudioUrl() {
      let rawUrl = course.audioUrl;
      if (!rawUrl) return;

      if (rawUrl.startsWith("audio/")) {
        rawUrl = "/" + rawUrl;
      }

      if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://") || rawUrl.startsWith("/")) {
        setResolvedAudioUrl(rawUrl);
      } else {
        const { data, error } = await supabase.storage
          .from("audio")
          .createSignedUrl(rawUrl, 3600);

        if (!error && data?.signedUrl) {
          setResolvedAudioUrl(data.signedUrl);
        } else {
          console.error("Failed to create signed URL for audio:", error);
          const { data: publicUrlData } = supabase.storage
            .from("audio")
            .getPublicUrl(rawUrl);
          setResolvedAudioUrl(publicUrlData.publicUrl);
        }
      }
    }

    resolvePdfUrl();
    resolveAudioUrl();
  }, [course]);

  const iframeSrc =
    pdfUrl && activeChapter ? `${pdfUrl}#page=${activeChapter.page}&toolbar=0&navpanes=0` : "";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden flex-col">
      <header className="shrink-0 h-14 border-b flex items-center px-4 justify-between bg-card z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="shrink-0 text-muted-foreground"
          >
            <Link to={fromPath}>
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="shrink-0"
            title="Toggle Sidebar"
          >
            <List className="size-5" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="size-4 text-accent" />
              {course.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {resolvedAudioUrl && (
            <div className="flex items-center pl-4 border-l">
              <audio controls src={resolvedAudioUrl} className="h-8 w-64 md:w-80 outline-none" />
            </div>
          )}
          <ShareButton
            title={`${course.title} — PassAsistant Course`}
            description={course.description || "Learn and prepare with study resources on PassAsistant."}
          />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden relative">
        <aside
          className={`shrink-0 w-80 border-r bg-muted/30 flex flex-col transition-all duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full absolute h-full"}`}
        >
          <div className="p-4 border-b bg-card">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Table of Contents
            </h2>
            <p className="text-xs text-muted-foreground">{course.chapters.length} chapters</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {course.chapters.map((chapter, index) => {
              const isActive = activeChapter?.id === chapter.id;
              return (
                <button
                  key={chapter.id}
                  onClick={() => setActiveChapter(chapter)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-start gap-3 transition-colors ${isActive ? "bg-accent/10 text-accent font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
                >
                  <span
                    className={`shrink-0 mt-0.5 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${isActive ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {index + 1}
                  </span>
                  <span className="leading-snug">{chapter.title}</span>
                </button>
              );
            })}
          </div>
        </aside>
        <main className={`flex-1 relative bg-black transition-all duration-300 ${!isSidebarOpen ? "w-full" : ""}`}>
          {iframeSrc ? (
            <iframe
              key={activeChapter?.id + "-" + pdfUrl}
              src={iframeSrc}
              className="w-full h-full border-none"
              title={course.title}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm bg-card">
              Loading secure document...
            </div>
          )}
        </main>
      </div>
    </div>
  );
}