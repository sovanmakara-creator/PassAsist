export type Chapter = {
  id: string;
  title: string;
  page: number;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  audioUrl?: string;
  chapters: Chapter[];
};

export const COURSES: Record<string, Course> = {
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
      { id: "ch11", title: "Coda", page: 46 },
    ],
  },
  "helpful-1": {
    id: "helpful-1",
    title: "1000+ Phrasal Verbs with meanings and sentences",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/1000-phrasal-verbs-with-meanings-and-sentences.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-2": {
    id: "helpful-2",
    title: "130 common mistakes in English",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/130-common-mistakes-in-english.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-3": {
    id: "helpful-3",
    title: "49 Easy English Conversation Dialogues",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/49-easy-english-conversation-dialogues-for-beginners-in.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-4": {
    id: "helpful-4",
    title: "49 English Conversation Topics",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/49-english-conversation-topics.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-5": {
    id: "helpful-5",
    title: "500 Words, Phrases, Idioms for TOEFL",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/500-words-phrases-idioms-for-the-toefl-cam-edu.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-6": {
    id: "helpful-6",
    title: "501 Critical Reading Questions",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/501-critical-reading-questions.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-7": {
    id: "helpful-7",
    title: "501 Sentence Completion Questions",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/501-sentence-completion-questions.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-8": {
    id: "helpful-8",
    title: "501 Synonym and Antonym Questions",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/501-synonym-and-antonym-questions.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-9": {
    id: "helpful-9",
    title: "Advanced English Conversation Dialogues",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/advanced-english-conversation-dialogues-speak-english-like.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-10": {
    id: "helpful-10",
    title: "Advanced English Conversations",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/advanced-english-conversations-speak-english-like-a-native.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-11": {
    id: "helpful-11",
    title: "Advanced English Dialogues",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/advanced-english-dialogues-stories-vocabulary.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-12": {
    id: "helpful-12",
    title: "Collins common errors in English",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/collins-common-errors-in-english-and-how-to-avoid-them.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-13": {
    id: "helpful-13",
    title: "Grammar for everyone",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/grammar-for-everyone-practical-tools-for-learning.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-14": {
    id: "helpful-14",
    title: "Great Debates for ESL-EFL",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/great-debates-for-esl-efl-39-important-debating-topics.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-15": {
    id: "helpful-15",
    title: "Perfect Phrases for ESL",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/perfect-phrases-for-esl-conversational-skills.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-16": {
    id: "helpful-16",
    title: "Shortcut To English Collocations",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/shortcut-to-english-collocations-master-2000-english.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-17": {
    id: "helpful-17",
    title: "Slang & Informal English",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/slang-informal-english.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-18": {
    id: "helpful-18",
    title: "Spoken English in Dialogues",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/spoken-english-in-dialogues-833-common-english-sentences.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "helpful-19": {
    id: "helpful-19",
    title: "Spoken English - Real life Phrases",
    description: "General English and helpful learning resource.",
    pdfUrl: "/resources/helpful/spoken-english-real-life-phrases-and-sentences.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "ielts-l-local1": {
    id: "ielts-l-local1",
    title: "GEP 11B Unit 5 Listening Quiz",
    description: "Listening quiz resource from GEP 11B Unit 5.",
    pdfUrl: "/resources/listening/gep-11b-unit-5-listening-quiz.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "ielts-r-local1": {
    id: "ielts-r-local1",
    title: "GEP 11B Unit 5 Reading Quiz",
    description: "Reading quiz resource from GEP 11B Unit 5.",
    pdfUrl: "/resources/reading/gep-11b-unit-5-reading-quiz.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "ielts-r-local2": {
    id: "ielts-r-local2",
    title: "GEP 11B Unit 6 Reading Quiz",
    description: "Reading quiz resource from GEP 11B Unit 6.",
    pdfUrl: "/resources/reading/gep-11b-unit-6-reading-quiz.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "ielts-r-local3": {
    id: "ielts-r-local3",
    title: "GEP 11B Unit 7 Reading Quiz",
    description: "Reading quiz resource from GEP 11B Unit 7.",
    pdfUrl: "/resources/reading/gep-11b-unit-7-reading-quiz.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "ielts-r-local4": {
    id: "ielts-r-local4",
    title: "RFI PT2 Reading",
    description: "RFI Part 2 Reading practice resource.",
    pdfUrl: "/resources/reading/rfi-pt2-reading-v2.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "ielts-r-local5": {
    id: "ielts-r-local5",
    title: "IELTS Reading Strategies — Ultimate Guide",
    description: "The ultimate guide to IELTS reading strategies with tips and practice exercises.",
    pdfUrl: "/resources/ielts/ielts-reading-strategies-guide.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "ielts-r-local6": {
    id: "ielts-r-local6",
    title: "Reading Keywords — IELTS 13",
    description: "Key vocabulary and keywords from IELTS Cambridge 13 reading passages.",
    pdfUrl: "/resources/ielts/reading-keywords-ielts-13.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "ielts-s-local1": {
    id: "ielts-s-local1",
    title: "IELTS Speaking Sample Answers",
    description: "Collection of sample speaking answers for common IELTS speaking topics.",
    pdfUrl: "/resources/ielts/ielts-speaking-sample-answer.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "ielts-s-local2": {
    id: "ielts-s-local2",
    title: "IELTS Speaking Strategies — Ultimate Guide",
    description:
      "The ultimate guide to IELTS speaking strategies with tips and practice exercises.",
    pdfUrl: "/resources/ielts/ielts-speaking-strategies-guide.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "toefl-w-local1": {
    id: "toefl-w-local1",
    title: "Ace the TOEFL Essay (TWE)",
    description: "Everything you need to ace the TOEFL essay with strategies and sample responses.",
    pdfUrl: "/resources/toefl/ace-the-toefl-essay.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
  "toeic-lr-local1": {
    id: "toeic-lr-local1",
    title: "Tactics for TOEIC — Listening & Reading",
    description: "Comprehensive tactics guide for TOEIC Listening and Reading test sections.",
    pdfUrl: "/resources/toeic/tactics-for-toeic-listening-reading.pdf",
    chapters: [{ id: "ch1", title: "Document Start", page: 1 }],
  },
};
