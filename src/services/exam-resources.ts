/**
 * Curated practice test & mock test resources for IELTS, TOEFL, and TOEIC.
 *
 * Sources include: British Council, IDP, Cambridge, ETS, Magoosh,
 * Exam English, IELTS Online Tests, GeeksforGeeks,
 * TestDEN, 4Tests, BestMyTest, EnglishTestStore, and others.
 */

export type PracticeResource = {
  id: string;
  title: string;
  source: string;
  url: string;
  type: "practice" | "mock" | "tips";
  difficulty?: "beginner" | "intermediate" | "advanced";
  description: string;
};

export type SkillKey = "listening" | "reading" | "writing" | "speaking";

export type ExamResourceMap = {
  [skill in SkillKey]?: PracticeResource[];
} & {
  mock: PracticeResource[];
  helpful?: PracticeResource[];
  general?: PracticeResource[];
};

export const HELPFUL_SOURCES: PracticeResource[] = [
  {
    id: "helpful-1",
    title: "1000+ Phrasal Verbs with meanings and sentences",
    source: "Helpful Source",
    url: "/resources/helpful/1000-phrasal-verbs-with-meanings-and-sentences.pdf",
    type: "tips",
    difficulty: "intermediate",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-2",
    title: "130 common mistakes in English",
    source: "Helpful Source",
    url: "/resources/helpful/130-common-mistakes-in-english.pdf",
    type: "tips",
    difficulty: "intermediate",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-3",
    title: "49 Easy English Conversation Dialogues",
    source: "Helpful Source",
    url: "/resources/helpful/49-easy-english-conversation-dialogues-for-beginners-in.pdf",
    type: "tips",
    difficulty: "beginner",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-4",
    title: "49 English Conversation Topics",
    source: "Helpful Source",
    url: "/resources/helpful/49-english-conversation-topics.pdf",
    type: "tips",
    difficulty: "intermediate",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-5",
    title: "500 Words, Phrases, Idioms for TOEFL",
    source: "Helpful Source",
    url: "/resources/helpful/500-words-phrases-idioms-for-the-toefl-cam-edu.pdf",
    type: "tips",
    difficulty: "advanced",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-6",
    title: "501 Critical Reading Questions",
    source: "Helpful Source",
    url: "/resources/helpful/501-critical-reading-questions.pdf",
    type: "practice",
    difficulty: "advanced",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-7",
    title: "501 Sentence Completion Questions",
    source: "Helpful Source",
    url: "/resources/helpful/501-sentence-completion-questions.pdf",
    type: "practice",
    difficulty: "intermediate",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-8",
    title: "501 Synonym and Antonym Questions",
    source: "Helpful Source",
    url: "/resources/helpful/501-synonym-and-antonym-questions.pdf",
    type: "practice",
    difficulty: "intermediate",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-9",
    title: "Advanced English Conversation Dialogues",
    source: "Helpful Source",
    url: "/resources/helpful/advanced-english-conversation-dialogues-speak-english-like.pdf",
    type: "tips",
    difficulty: "advanced",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-10",
    title: "Advanced English Conversations",
    source: "Helpful Source",
    url: "/resources/helpful/advanced-english-conversations-speak-english-like-a-native.pdf",
    type: "tips",
    difficulty: "advanced",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-11",
    title: "Advanced English Dialogues",
    source: "Helpful Source",
    url: "/resources/helpful/advanced-english-dialogues-stories-vocabulary.pdf",
    type: "tips",
    difficulty: "advanced",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-12",
    title: "Collins common errors in English",
    source: "Helpful Source",
    url: "/resources/helpful/collins-common-errors-in-english-and-how-to-avoid-them.pdf",
    type: "tips",
    difficulty: "intermediate",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-13",
    title: "Grammar for everyone",
    source: "Helpful Source",
    url: "/resources/helpful/grammar-for-everyone-practical-tools-for-learning.pdf",
    type: "tips",
    difficulty: "intermediate",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-14",
    title: "Great Debates for ESL-EFL",
    source: "Helpful Source",
    url: "/resources/helpful/great-debates-for-esl-efl-39-important-debating-topics.pdf",
    type: "tips",
    difficulty: "advanced",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-15",
    title: "Perfect Phrases for ESL",
    source: "Helpful Source",
    url: "/resources/helpful/perfect-phrases-for-esl-conversational-skills.pdf",
    type: "tips",
    difficulty: "intermediate",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-16",
    title: "Shortcut To English Collocations",
    source: "Helpful Source",
    url: "/resources/helpful/shortcut-to-english-collocations-master-2000-english.pdf",
    type: "tips",
    difficulty: "advanced",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-17",
    title: "Slang & Informal English",
    source: "Helpful Source",
    url: "/resources/helpful/slang-informal-english.pdf",
    type: "tips",
    difficulty: "advanced",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-18",
    title: "Spoken English in Dialogues",
    source: "Helpful Source",
    url: "/resources/helpful/spoken-english-in-dialogues-833-common-english-sentences.pdf",
    type: "tips",
    difficulty: "intermediate",
    description: "General English and helpful learning resource.",
  },
  {
    id: "helpful-19",
    title: "Spoken English - Real life Phrases",
    source: "Helpful Source",
    url: "/resources/helpful/spoken-english-real-life-phrases-and-sentences.pdf",
    type: "tips",
    difficulty: "intermediate",
    description: "General English and helpful learning resource.",
  },
];

export const EXAM_RESOURCES: Record<string, ExamResourceMap> = {
  /* ================================================================ */
  /*  IELTS                                                           */
  /* ================================================================ */
  ielts: {
    listening: [
      {
        id: "ielts-l-local1",
        title: "GEP 11B Unit 5 Listening Quiz",
        source: "Local Upload",
        url: "/resources/listening/gep-11b-unit-5-listening-quiz.pdf",
        type: "practice",
        difficulty: "intermediate",
        description: "Listening quiz resource from GEP 11B Unit 5.",
      },
      {
        id: "ielts-l-bc1",
        title: "Listening Practice Test — Set 1",
        source: "British Council",
        url: "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests/listening",
        type: "practice",
        difficulty: "intermediate",
        description:
          "Official IELTS Listening practice with audio, questions, and answer key from the British Council.",
      },
      {
        id: "ielts-l-idp1",
        title: "Listening Sample Test",
        source: "IDP IELTS",
        url: "https://ielts.idp.com/prepare/free-ielts-practice-tests/listening",
        type: "practice",
        difficulty: "intermediate",
        description:
          "IDP's official IELTS Listening sample with 4 sections, 40 questions, and answer key.",
      },
      {
        id: "ielts-l-ee1",
        title: "IELTS Listening Test",
        source: "Exam English",
        url: "https://www.examenglish.com/IELTS/IELTS_listening.htm",
        type: "practice",
        difficulty: "intermediate",
        description:
          "Free online Listening practice test with instant scoring and answer explanations.",
      },
      {
        id: "ielts-l-iot1",
        title: "Full Listening Mock Test",
        source: "IELTS Online Tests",
        url: "https://ieltsonlinetests.com/ielts-exam-library#listening",
        type: "practice",
        difficulty: "advanced",
        description:
          "Extensive library of community-contributed IELTS Listening tests with full audio.",
      },
      {
        id: "ielts-l-bc-tips",
        title: "Listening Tips & Strategies",
        source: "British Council",
        url: "https://takeielts.britishcouncil.org/take-ielts/prepare/listening",
        type: "tips",
        description:
          "Expert tips on note-taking, following conversations, and handling different question types.",
      },
    ],
    reading: [
      {
        id: "ielts-r-local1",
        title: "GEP 11B Unit 5 Reading Quiz",
        source: "Local Upload",
        url: "/resources/reading/gep-11b-unit-5-reading-quiz.pdf",
        type: "practice",
        difficulty: "intermediate",
        description: "Reading quiz resource from GEP 11B Unit 5.",
      },
      {
        id: "ielts-r-local2",
        title: "GEP 11B Unit 6 Reading Quiz",
        source: "Local Upload",
        url: "/resources/reading/gep-11b-unit-6-reading-quiz.pdf",
        type: "practice",
        difficulty: "intermediate",
        description: "Reading quiz resource from GEP 11B Unit 6.",
      },
      {
        id: "ielts-r-local3",
        title: "GEP 11B Unit 7 Reading Quiz",
        source: "Local Upload",
        url: "/resources/reading/gep-11b-unit-7-reading-quiz.pdf",
        type: "practice",
        difficulty: "intermediate",
        description: "Reading quiz resource from GEP 11B Unit 7.",
      },
      {
        id: "ielts-r-local4",
        title: "RFI PT2 Reading",
        source: "Local Upload",
        url: "/resources/reading/rfi-pt2-reading-v2.pdf",
        type: "practice",
        difficulty: "intermediate",
        description: "RFI Part 2 Reading practice resource.",
      },
      {
        id: "ielts-r-bc1",
        title: "Academic Reading Practice Test",
        source: "British Council",
        url: "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests/reading",
        type: "practice",
        difficulty: "intermediate",
        description:
          "Official IELTS Academic Reading practice with 3 passages, 40 questions, and answers.",
      },
      {
        id: "ielts-r-idp1",
        title: "Reading Sample Test",
        source: "IDP IELTS",
        url: "https://ielts.idp.com/prepare/free-ielts-practice-tests/reading",
        type: "practice",
        difficulty: "intermediate",
        description:
          "IDP's official Reading practice covering matching, true/false/not given, and completion tasks.",
      },
      {
        id: "ielts-r-ee1",
        title: "IELTS Reading Test",
        source: "Exam English",
        url: "https://www.examenglish.com/IELTS/IELTS_reading.htm",
        type: "practice",
        difficulty: "intermediate",
        description: "Free Reading test with multiple question types and instant feedback.",
      },
      {
        id: "ielts-r-iot1",
        title: "Reading Test Library",
        source: "IELTS Online Tests",
        url: "https://ieltsonlinetests.com/ielts-exam-library#reading",
        type: "practice",
        difficulty: "advanced",
        description:
          "Large collection of Academic and General Training Reading tests with answer keys.",
      },
      {
        id: "ielts-r-bc-tips",
        title: "Reading Tips & Strategies",
        source: "British Council",
        url: "https://takeielts.britishcouncil.org/take-ielts/prepare/reading",
        type: "tips",
        description: "Skimming, scanning, and time management techniques for the Reading section.",
      },
      {
        id: "ielts-r-course1",
        title: "Secrets to IELTS Success - Band 8",
        source: "Local Upload",
        url: "/courses/secrets-to-ielts-success",
        type: "tips",
        difficulty: "advanced",
        description:
          "Comprehensive guide to achieving a Band 8 in IELTS. Interactive course viewer.",
      },
      {
        id: "ielts-r-local5",
        title: "IELTS Reading Strategies — Ultimate Guide",
        source: "Local Upload",
        url: "/resources/ielts/ielts-reading-strategies-guide.pdf",
        type: "tips",
        difficulty: "advanced",
        description:
          "The ultimate guide to IELTS reading strategies with tips and practice exercises.",
      },
      {
        id: "ielts-r-local6",
        title: "Reading Keywords — IELTS 13",
        source: "Local Upload",
        url: "/resources/ielts/reading-keywords-ielts-13.pdf",
        type: "tips",
        difficulty: "intermediate",
        description: "Key vocabulary and keywords from IELTS Cambridge 13 reading passages.",
      },
    ],
    writing: [
      {
        id: "ielts-w-internal",
        title: "AI Writing Tutor — Task 1 & 2",
        source: "PassAssist",
        url: "/writing?exam=ielts_task2",
        type: "practice",
        difficulty: "intermediate",
        description:
          "Get instant examiner-grade AI feedback on IELTS Writing tasks with band scoring and grammar analysis.",
      },
      {
        id: "ielts-w-bc1",
        title: "Writing Practice Test — Task 1 & 2",
        source: "British Council",
        url: "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests/writing",
        type: "practice",
        difficulty: "intermediate",
        description:
          "Official Writing practice with sample questions and model answers from the British Council.",
      },
      {
        id: "ielts-w-idp1",
        title: "Writing Sample Questions",
        source: "IDP IELTS",
        url: "https://ielts.idp.com/prepare/free-ielts-practice-tests/writing",
        type: "practice",
        difficulty: "intermediate",
        description:
          "IDP's official Writing practice with sample prompts for both Task 1 and Task 2.",
      },
      {
        id: "ielts-w-ee1",
        title: "IELTS Writing Test",
        source: "Exam English",
        url: "https://www.examenglish.com/IELTS/IELTS_writing.htm",
        type: "practice",
        difficulty: "intermediate",
        description: "Writing task practice with timing and guidance on essay structure.",
      },
      {
        id: "ielts-w-bc-tips",
        title: "Writing Band Descriptors & Tips",
        source: "British Council",
        url: "https://takeielts.britishcouncil.org/take-ielts/prepare/writing",
        type: "tips",
        description:
          "Understand the four assessment criteria and learn how to maximize your band score.",
      },
    ],
    speaking: [
      {
        id: "ielts-s-bc1",
        title: "Speaking Practice — Parts 1, 2 & 3",
        source: "British Council",
        url: "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests/speaking",
        type: "practice",
        difficulty: "intermediate",
        description:
          "Official Speaking sample questions with examiner commentary and model answers.",
      },
      {
        id: "ielts-s-idp1",
        title: "Speaking Sample Questions",
        source: "IDP IELTS",
        url: "https://ielts.idp.com/prepare/free-ielts-practice-tests/speaking",
        type: "practice",
        difficulty: "intermediate",
        description:
          "IDP's Speaking practice with cue cards, follow-up questions, and examiner notes.",
      },
      {
        id: "ielts-s-ee1",
        title: "IELTS Speaking Test",
        source: "Exam English",
        url: "https://www.examenglish.com/IELTS/IELTS_speaking.htm",
        type: "practice",
        difficulty: "intermediate",
        description:
          "Speaking practice with recorded questions you can respond to and self-assess.",
      },
      {
        id: "ielts-s-iot1",
        title: "Speaking Topic Library",
        source: "IELTS Online Tests",
        url: "https://ieltsonlinetests.com/ielts-exam-library#speaking",
        type: "practice",
        difficulty: "advanced",
        description: "Extensive bank of recent Speaking topics organized by part and theme.",
      },
      {
        id: "ielts-s-bc-tips",
        title: "Speaking Tips & Strategies",
        source: "British Council",
        url: "https://takeielts.britishcouncil.org/take-ielts/prepare/speaking",
        type: "tips",
        description:
          "Fluency techniques, vocabulary range tips, and how to handle Part 2 cue cards.",
      },
      {
        id: "ielts-s-local1",
        title: "IELTS Speaking Sample Answers",
        source: "Local Upload",
        url: "/resources/ielts/ielts-speaking-sample-answer.pdf",
        type: "tips",
        difficulty: "intermediate",
        description: "Collection of sample speaking answers for common IELTS speaking topics.",
      },
      {
        id: "ielts-s-local2",
        title: "IELTS Speaking Strategies — Ultimate Guide",
        source: "Local Upload",
        url: "/resources/ielts/ielts-speaking-strategies-guide.pdf",
        type: "tips",
        difficulty: "advanced",
        description:
          "The ultimate guide to IELTS speaking strategies with tips and practice exercises.",
      },
    ],
    mock: [
      {
        id: "ielts-m-bc1",
        title: "Full Practice Test (All 4 Skills)",
        source: "British Council",
        url: "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests",
        type: "mock",
        difficulty: "intermediate",
        description:
          "Complete set of official practice tests for Listening, Reading, Writing, and Speaking.",
      },
      {
        id: "ielts-m-idp1",
        title: "Full IELTS Practice Test",
        source: "IDP IELTS",
        url: "https://ielts.idp.com/prepare/free-ielts-practice-tests",
        type: "mock",
        difficulty: "intermediate",
        description: "IDP's complete IELTS test simulation covering all four modules.",
      },
      {
        id: "ielts-m-iot1",
        title: "Full Mock Test Library",
        source: "IELTS Online Tests",
        url: "https://ieltsonlinetests.com/ielts-exam-library",
        type: "mock",
        difficulty: "advanced",
        description:
          "Hundreds of full-length IELTS mock tests with audio, passages, and detailed answers.",
      },
      {
        id: "ielts-m-ee1",
        title: "IELTS Practice Tests",
        source: "Exam English",
        url: "https://www.examenglish.com/IELTS/index.php",
        type: "mock",
        difficulty: "intermediate",
        description:
          "Section-by-section practice tests that can be combined for a full mock experience.",
      },
      {
        id: "ielts-m-cambridge",
        title: "Cambridge IELTS Practice Materials",
        source: "Cambridge English",
        url: "https://www.cambridgeenglish.org/exams-and-tests/ielts/preparation/",
        type: "mock",
        difficulty: "advanced",
        description:
          "Official Cambridge preparation resources, including links to published test books.",
      },
    ],
  },

  /* ================================================================ */
  /*  TOEFL                                                           */
  /* ================================================================ */
  toefl: {
    reading: [
      {
        id: "toefl-r-ets1",
        title: "Reading Practice Questions",
        source: "ETS Official",
        url: "https://www.ets.org/toefl/test-takers/ibt/prepare/practice-tests.html",
        type: "practice",
        difficulty: "intermediate",
        description: "Official TOEFL iBT Reading practice questions from the test maker (ETS).",
      },
      {
        id: "toefl-r-mag1",
        title: "Reading Practice Test",
        source: "Magoosh",
        url: "https://magoosh.com/toefl/toefl-reading-practice/",
        type: "practice",
        difficulty: "intermediate",
        description:
          "Magoosh's free Reading practice with passages, questions, and detailed explanations.",
      },

      {
        id: "toefl-r-gfg1",
        title: "TOEFL Reading Practice Tests",
        source: "GeeksforGeeks",
        url: "https://www.geeksforgeeks.org/toefl-reading-practice-test/",
        type: "practice",
        difficulty: "beginner",
        description: "Downloadable Reading practice sets with answer keys and explanations.",
      },
      {
        id: "toefl-r-tips",
        title: "Reading Section Strategies",
        source: "Magoosh",
        url: "https://magoosh.com/toefl/toefl-reading-tips/",
        type: "tips",
        description:
          "Expert strategies for inference questions, vocabulary-in-context, and prose summaries.",
      },
    ],
    listening: [
      {
        id: "toefl-l-ets1",
        title: "Listening Practice Questions",
        source: "ETS Official",
        url: "https://www.ets.org/toefl/test-takers/ibt/prepare/practice-tests.html",
        type: "practice",
        difficulty: "intermediate",
        description:
          "Official TOEFL iBT Listening sample with lectures and conversations from ETS.",
      },
      {
        id: "toefl-l-mag1",
        title: "Listening Practice Test",
        source: "Magoosh",
        url: "https://magoosh.com/toefl/toefl-listening-practice/",
        type: "practice",
        difficulty: "intermediate",
        description: "Free Listening practice with audio clips, note-taking guidance, and answers.",
      },

      {
        id: "toefl-l-td1",
        title: "TOEFL Listening Simulation",
        source: "TestDEN",
        url: "https://www.testden.com/toefl/listening.asp",
        type: "practice",
        difficulty: "beginner",
        description: "Free online Listening simulation with conversations and academic lectures.",
      },
      {
        id: "toefl-l-tips",
        title: "Listening Section Strategies",
        source: "Magoosh",
        url: "https://magoosh.com/toefl/toefl-listening-tips/",
        type: "tips",
        description:
          "Note-taking techniques, understanding lecture structure, and eliminating wrong answers.",
      },
    ],
    speaking: [
      {
        id: "toefl-s-ets1",
        title: "Speaking Practice Questions",
        source: "ETS Official",
        url: "https://www.ets.org/toefl/test-takers/ibt/prepare/practice-tests.html",
        type: "practice",
        difficulty: "intermediate",
        description: "Official Speaking task samples covering independent and integrated tasks.",
      },
      {
        id: "toefl-s-mag1",
        title: "Speaking Practice Test",
        source: "Magoosh",
        url: "https://magoosh.com/toefl/toefl-speaking-practice/",
        type: "practice",
        difficulty: "intermediate",
        description: "Timed Speaking practice with sample responses and scoring rubrics.",
      },

      {
        id: "toefl-s-tips",
        title: "Speaking Section Strategies",
        source: "Magoosh",
        url: "https://magoosh.com/toefl/toefl-speaking-tips/",
        type: "tips",
        description:
          "Templates, timing strategies, and how to structure 45-second and 60-second responses.",
      },
    ],
    writing: [
      {
        id: "toefl-w-internal",
        title: "AI Writing Tutor — TOEFL",
        source: "PassAssist",
        url: "/writing?exam=toefl",
        type: "practice",
        difficulty: "intermediate",
        description:
          "Get instant AI feedback on TOEFL Independent and Integrated writing tasks with scoring.",
      },
      {
        id: "toefl-w-ets1",
        title: "Writing Practice Questions",
        source: "ETS Official",
        url: "https://www.ets.org/toefl/test-takers/ibt/prepare/practice-tests.html",
        type: "practice",
        difficulty: "intermediate",
        description: "Official TOEFL Writing sample tasks with scoring guides from ETS.",
      },
      {
        id: "toefl-w-mag1",
        title: "Writing Practice & Templates",
        source: "Magoosh",
        url: "https://magoosh.com/toefl/toefl-writing-practice/",
        type: "practice",
        difficulty: "intermediate",
        description: "Writing practice with essay templates, model responses, and scoring rubrics.",
      },
      {
        id: "toefl-w-tips",
        title: "Writing Section Strategies",
        source: "Magoosh",
        url: "https://magoosh.com/toefl/toefl-writing-tips/",
        type: "tips",
        description:
          "Time management, paragraph structure, and how to integrate reading/listening into writing.",
      },
      {
        id: "toefl-w-local1",
        title: "Ace the TOEFL Essay (TWE)",
        source: "Local Upload",
        url: "/resources/toefl/ace-the-toefl-essay.pdf",
        type: "tips",
        difficulty: "advanced",
        description:
          "Everything you need to ace the TOEFL essay with strategies and sample responses.",
      },
    ],
    mock: [
      {
        id: "toefl-m-ets1",
        title: "Free TOEFL iBT Practice Test",
        source: "ETS Official",
        url: "https://www.ets.org/toefl/test-takers/ibt/prepare/practice-tests.html",
        type: "mock",
        difficulty: "intermediate",
        description: "The official free practice test from ETS with real past exam questions.",
      },
      {
        id: "toefl-m-mag1",
        title: "Free Full-Length Practice Test",
        source: "Magoosh",
        url: "https://magoosh.com/toefl/toefl-practice-test/",
        type: "mock",
        difficulty: "intermediate",
        description:
          "Magoosh's comprehensive mock test with scoring and detailed answer explanations.",
      },
      {
        id: "toefl-m-4t1",
        title: "TOEFL Practice Test",
        source: "4Tests",
        url: "https://www.4tests.com/toefl",
        type: "mock",
        difficulty: "beginner",
        description: "Free, untimed TOEFL practice test — great for beginners learning the format.",
      },
      {
        id: "toefl-m-td1",
        title: "TOEFL Test Simulation",
        source: "TestDEN",
        url: "https://www.testden.com/toefl/",
        type: "mock",
        difficulty: "intermediate",
        description:
          "Up to 3 free full-length practice tests simulating the real TOEFL environment.",
      },
    ],
  },

  /* ================================================================ */
  /*  TOEIC                                                           */
  /* ================================================================ */
  toeic: {
    listening: [
      {
        id: "toeic-l-ets1",
        title: "Listening Sample Questions",
        source: "ETS Official",
        url: "https://www.ets.org/toeic/test-takers/listening-reading/prepare.html",
        type: "practice",
        difficulty: "intermediate",
        description: "Official TOEIC Listening sample questions from ETS with all 4 parts covered.",
      },
      {
        id: "toeic-l-ee1",
        title: "TOEIC Listening Test",
        source: "Exam English",
        url: "https://www.examenglish.com/TOEIC/TOEIC_listening.htm",
        type: "practice",
        difficulty: "intermediate",
        description:
          "Free Listening practice with photographs, question-response, and short talks.",
      },
      {
        id: "toeic-l-bmt1",
        title: "Listening Practice Tests",
        source: "BestMyTest",
        url: "https://www.bestmytest.com/toeic/listening",
        type: "practice",
        difficulty: "intermediate",
        description:
          "Multiple Listening practice sets organized by part with audio and answer keys.",
      },
      {
        id: "toeic-l-ets2",
        title: "Listening & Reading Complete Test",
        source: "EnglishTestStore",
        url: "https://englishteststore.net/index.php?option=com_content&view=article&id=11838",
        type: "practice",
        difficulty: "beginner",
        description:
          "Wide collection of free TOEIC Listening exercises covering all question types.",
      },
      {
        id: "toeic-l-tips",
        title: "Listening Tips & Strategies",
        source: "Exam English",
        url: "https://www.examenglish.com/TOEIC/TOEIC_listening_tips.htm",
        type: "tips",
        description: "Strategies for photos, question-response, conversations, and talks sections.",
      },
    ],
    reading: [
      {
        id: "toeic-r-ets1",
        title: "Reading Sample Questions",
        source: "ETS Official",
        url: "https://www.ets.org/toeic/test-takers/listening-reading/prepare.html",
        type: "practice",
        difficulty: "intermediate",
        description: "Official TOEIC Reading sample questions from ETS with 3 parts covered.",
      },
      {
        id: "toeic-r-ee1",
        title: "TOEIC Reading Test",
        source: "Exam English",
        url: "https://www.examenglish.com/TOEIC/TOEIC_reading.htm",
        type: "practice",
        difficulty: "intermediate",
        description:
          "Free Reading practice with sentence completion, text completion, and reading comprehension.",
      },
      {
        id: "toeic-r-bmt1",
        title: "Reading Practice Tests",
        source: "BestMyTest",
        url: "https://www.bestmytest.com/toeic/reading",
        type: "practice",
        difficulty: "intermediate",
        description: "Multiple Reading practice sets organized by part with instant feedback.",
      },
      {
        id: "toeic-r-ets2",
        title: "Reading Exercises Library",
        source: "EnglishTestStore",
        url: "https://englishteststore.net/index.php?option=com_content&view=article&id=11839",
        type: "practice",
        difficulty: "beginner",
        description:
          "Free TOEIC Reading exercises covering incomplete sentences, text completion, and passages.",
      },
      {
        id: "toeic-r-tips",
        title: "Reading Tips & Strategies",
        source: "Exam English",
        url: "https://www.examenglish.com/TOEIC/TOEIC_reading_tips.htm",
        type: "tips",
        description:
          "Time management, grammar patterns, and skimming techniques for the Reading section.",
      },
      {
        id: "toeic-lr-local1",
        title: "Tactics for TOEIC — Listening & Reading",
        source: "Local Upload",
        url: "/resources/toeic/tactics-for-toeic-listening-reading.pdf",
        type: "tips",
        difficulty: "intermediate",
        description: "Comprehensive tactics guide for TOEIC Listening and Reading test sections.",
      },
    ],
    mock: [
      {
        id: "toeic-m-ets1",
        title: "Official TOEIC Preparation",
        source: "ETS Official",
        url: "https://www.ets.org/toeic/test-takers/listening-reading/prepare.html",
        type: "mock",
        difficulty: "intermediate",
        description: "Official TOEIC preparation materials and sample test from the test maker.",
      },
      {
        id: "toeic-m-ee1",
        title: "TOEIC Practice Tests",
        source: "Exam English",
        url: "https://www.examenglish.com/TOEIC/index.php",
        type: "mock",
        difficulty: "intermediate",
        description:
          "Complete Listening and Reading practice tests simulating the full TOEIC experience.",
      },
      {
        id: "toeic-m-bmt1",
        title: "Full TOEIC Mock Test",
        source: "BestMyTest",
        url: "https://www.bestmytest.com/toeic/practice-test",
        type: "mock",
        difficulty: "intermediate",
        description:
          "Full-length TOEIC mock test with auto-scoring and detailed performance analysis.",
      },
      {
        id: "toeic-m-par1",
        title: "Free Full Mock Exam",
        source: "Parroto",
        url: "https://parroto.app/toeic",
        type: "mock",
        difficulty: "intermediate",
        description:
          "Free full-length mock exam in official ETS format with auto-scoring and explanations.",
      },
      {
        id: "toeic-m-ets3",
        title: "TOEIC Practice Library",
        source: "EnglishTestStore",
        url: "https://englishteststore.net/index.php?option=com_content&view=category&id=48",
        type: "mock",
        difficulty: "beginner",
        description:
          "Large collection of free TOEIC practice tests covering both Listening and Reading.",
      },
    ],
  },
};
