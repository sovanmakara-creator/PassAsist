import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Plus,
  FileText,
  Settings,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  X,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Send,
  Search,
  BookOpen,
  PenLine,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAdminAiHelper } from "@/services/gemini.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin Panel — PassAsistant" }],
  }),
  component: AdminPage,
});

const STATIC_CATEGORIES = [
  { id: "ielts", name: "IELTS", sort_order: 1 },
  { id: "toefl", name: "TOEFL", sort_order: 2 },
  { id: "toeic", name: "TOEIC", sort_order: 3 },
  { id: "helpful", name: "Helpful Sources", sort_order: 4 },
  { id: "reading", name: "Reading Quiz", sort_order: 5 },
  { id: "listening", name: "Listening Quiz", sort_order: 6 },
];

interface CategoryRowProps {
  category: { id: string; name: string; sort_order: number };
  index: number;
  total: number;
  onRename: (newName: string) => void;
  onMove: (direction: "up" | "down") => void;
}

function CategoryRow({ category, index, total, onRename, onMove }: CategoryRowProps) {
  const [name, setName] = useState(category.name);

  useEffect(() => {
    setName(category.name);
  }, [category.name]);

  const hasChanged = name.trim() !== category.name && name.trim().length > 0;

  return (
    <div className="flex items-center gap-4 p-3 bg-muted/20 border border-border rounded-lg hover:bg-muted/40 transition-colors">
      <div className="text-xs font-semibold text-muted-foreground w-8">#{index + 1}</div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
        <div className="text-sm font-mono text-muted-foreground select-all">{category.id}</div>
        <div className="sm:col-span-2 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
            placeholder="Category Name"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRename(name)}
            disabled={!hasChanged}
            className="h-8 text-xs"
          >
            Rename
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={index === 0}
          onClick={() => onMove("up")}
          title="Move Up"
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={index === total - 1}
          onClick={() => onMove("down")}
          title="Move Down"
        >
          <ArrowDown className="size-4" />
        </Button>
      </div>
    </div>
  );
}

const EXAM_TOPIC_TYPES: Record<string, { label: string; parts: { value: string; label: string }[] }> = {
  ielts_speaking: {
    label: "IELTS Speaking",
    parts: [
      { value: "part1", label: "Part 1 (Interview)" },
      { value: "part2", label: "Part 2 (Cue Card)" },
      { value: "part3", label: "Part 3 (Discussion)" },
    ],
  },
  toefl_speaking: {
    label: "TOEFL Speaking",
    parts: [
      { value: "independent", label: "Independent Speaking" },
    ],
  },
  toeic_speaking: {
    label: "TOEIC Speaking",
    parts: [
      { value: "read_text", label: "Read a Text Aloud" },
      { value: "describe_picture", label: "Describe a Picture" },
      { value: "respond_to_questions", label: "Respond to Questions" },
      { value: "express_opinion", label: "Express an Opinion" },
    ],
  },
  ielts_task1: {
    label: "IELTS Writing Task 1",
    parts: [
      { value: "bar_chart", label: "Bar Chart" },
      { value: "line_graph", label: "Line Graph" },
      { value: "pie_chart", label: "Pie Chart" },
      { value: "table", label: "Table" },
      { value: "map", label: "Map" },
      { value: "process", label: "Process Diagram" },
    ],
  },
  ielts_task2: {
    label: "IELTS Writing Task 2",
    parts: [
      { value: "opinion", label: "Opinion / Agree-Disagree" },
      { value: "discussion", label: "Discussion (Both Views)" },
      { value: "problem_solution", label: "Problem & Solution" },
      { value: "advantages", label: "Advantages & Disadvantages" },
      { value: "two_part", label: "Two-Part Question" },
    ],
  },
  toefl_writing: {
    label: "TOEFL Writing",
    parts: [
      { value: "independent", label: "Independent Writing" },
      { value: "integrated", label: "Integrated Writing" },
      { value: "academic_discussion", label: "Academic Discussion" },
    ],
  },
  toeic_writing: {
    label: "TOEIC Writing",
    parts: [
      { value: "opinion_essay", label: "Opinion Essay" },
      { value: "email", label: "Email Response" },
    ],
  },
};

function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  console.log("[AdminPage Debug] auth state:", { user: user?.email, isAdmin, authLoading });

  const [activeTab, setActiveTab] = useState<
    "resources" | "upload" | "categories" | "pages" | "ai" | "topics"
  >("resources");

  // Topics Management State
  const [dbTopics, setDbTopics] = useState<any[]>([]);
  const [isTopicsLoading, setIsTopicsLoading] = useState(false);
  const [topicsMessage, setTopicsMessage] = useState("");
  const [topicsSearchQuery, setTopicsSearchQuery] = useState("");

  const [filterExam, setFilterExam] = useState("ielts_speaking");
  const [filterPart, setFilterPart] = useState("part1");

  // Modal / Add form state
  const [editingTopic, setEditingTopic] = useState<any | null>(null);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [topicPromptText, setTopicPromptText] = useState("");
  const [topicImageUrl, setTopicImageUrl] = useState("");
  const [topicExam, setTopicExam] = useState("ielts_speaking");
  const [topicPart, setTopicPart] = useState("part1");
  const [isSavingTopic, setIsSavingTopic] = useState(false);

  const fetchDbTopics = async () => {
    setIsTopicsLoading(true);
    try {
      const { data, error } = await supabase
        .from("topics" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setDbTopics(data);
      } else {
        console.warn("Failed to fetch topics from DB:", error?.message);
      }
    } catch (err) {
      console.error("Error fetching topics:", err);
    } finally {
      setIsTopicsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === "topics") {
      fetchDbTopics();
    }
  }, [isAdmin, activeTab]);

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicPromptText.trim()) {
      alert("Prompt text cannot be empty.");
      return;
    }

    setIsSavingTopic(true);
    setTopicsMessage("Saving topic...");

    try {
      let error = null;
      if (editingTopic) {
        // Update existing
        const { error: err } = await supabase
          .from("topics" as any)
          .update({
            exam: topicExam,
            part: topicPart,
            prompt_text: topicPromptText.trim(),
            image_url: topicImageUrl.trim() || null,
          })
          .eq("id", editingTopic.id);
        error = err;
      } else {
        // Insert new
        const { error: err } = await supabase
          .from("topics" as any)
          .insert({
            exam: topicExam,
            part: topicPart,
            prompt_text: topicPromptText.trim(),
            image_url: topicImageUrl.trim() || null,
          });
        error = err;
      }

      if (error) {
        setTopicsMessage(`Error: ${error.message}`);
      } else {
        setTopicsMessage("Topic successfully saved!");
        setShowTopicModal(false);
        fetchDbTopics();
        // Clear inputs
        setTopicPromptText("");
        setTopicImageUrl("");
      }
    } catch (err: any) {
      console.error("Failed to save topic:", err);
      setTopicsMessage("Failed to save topic.");
    } finally {
      setIsSavingTopic(false);
      setTimeout(() => setTopicsMessage(""), 3000);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm("Are you sure you want to delete this topic? This cannot be undone.")) {
      return;
    }

    setTopicsMessage("Deleting topic...");
    try {
      const { error } = await supabase
        .from("topics" as any)
        .delete()
        .eq("id", id);

      if (error) {
        setTopicsMessage(`Error: ${error.message}`);
      } else {
        setTopicsMessage("Topic deleted successfully!");
        fetchDbTopics();
      }
    } catch (err) {
      console.error("Failed to delete topic:", err);
      setTopicsMessage("Failed to delete topic.");
    } finally {
      setTimeout(() => setTopicsMessage(""), 3000);
    }
  };

  // Pages Tab State
  const [selectedPage, setSelectedPage] = useState<
    "privacy" | "terms" | "about" | "contact" | "portfolio"
  >("about");
  const [pageTitle, setPageTitle] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [pageSaveMessage, setPageSaveMessage] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState("");

  useEffect(() => {
    async function resolvePreview() {
      if (selectedPage !== "portfolio" || !pageContent) {
        setResolvedAvatarUrl("");
        return;
      }
      const match = pageContent.match(/^-\s+\*\*avatar\*\*:\s*(.*)$/im);
      const url = match && match[1] ? match[1].trim() : "";
      if (!url) {
        setResolvedAvatarUrl("");
        return;
      }

      const storagePrefix = "/public/pdfs/";
      const idx = url.indexOf(storagePrefix);
      if (idx !== -1) {
        const path = url.substring(idx + storagePrefix.length);
        const { data, error } = await supabase.storage.from("pdfs").createSignedUrl(path, 3600);
        if (!error && data?.signedUrl) {
          setResolvedAvatarUrl(data.signedUrl);
          return;
        }
      }
      setResolvedAvatarUrl(url);
    }
    resolvePreview();
  }, [pageContent, selectedPage]);

  const DEFAULT_PAGES_CONTENT = {
    privacy: `# Privacy Policy\n\nLast updated: ${new Date().toLocaleDateString()}\n\nPassAsistant ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by PassAsistant.\n\n## 1. Information We Collect\nWe collect information you provide directly to us when you create an account, practice writing or speaking tasks, or communicate with us.\n\n## 2. Cookies and Tracking Technologies\nWe use cookies to enhance your experience, analyze usage, and personalize content. We may also display advertisements served by Google AdSense.\n\n### Google DoubleClick DART Cookie\nGoogle is one of the third-party vendors on our site. It uses cookies, known as DART cookies, to serve ads to our site visitors based on their visit to PassAsistant and other sites on the internet. Visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL: https://policies.google.com/technologies/ads\n\n## 3. Contact Us\nIf you have any questions about this Privacy Policy, please contact us at support@prepai.com.`,
    terms: `# Terms of Service\n\nLast updated: ${new Date().toLocaleDateString()}\n\nPlease read these Terms of Service ("Terms") carefully before using PassAsistant.\n\n## 1. Agreement to Terms\nBy accessing or using PassAsistant, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the service.\n\n## 2. Learning Material & AI Feedback\nPassAsistant provides AI-generated feedback for English proficiency exams (IELTS, TOEFL, TOEIC). This feedback is for educational purposes and is not an official score. We do not guarantee score improvements.\n\n## 3. Limitation of Liability\nIn no event shall PassAsistant be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the service.`,
    about: `# About PassAsistant\n\nPassAsistant is an advanced AI-powered English proficiency exam preparation platform designed for serious learners preparing for IELTS, TOEFL, and TOEIC tests.\n\n## Our Mission\nOur mission is to democratize high-quality test prep. Private exam tutoring is expensive and inaccessible to many. PassAsistant leverages state-of-the-art AI to provide immediate, detailed feedback on writing, speaking, listening, and reading skills at a fraction of the cost.\n\n## Key Features\n- **AI Writing Tutor**: Real-time evaluation of essays with band score estimations, grammar explanations, and vocabulary enhancements.\n- **AI Speaking Trainer**: Interactive speaking prompts with audio analysis covering pronunciation and fluency.\n- **Adaptive Reading & Listening**: Complete mock exams with automated tracking and page-by-page references.`,
    contact: `# Contact Us\n\nHave questions, feedback, or need assistance? We are here to help!\n\n### Get in Touch\n- **Support Email**: support@prepai.com\n- **Office Hours**: Monday – Friday, 9:00 AM – 5:00 PM EST\n\n### Guidelines\nFor account support or bugs, please include your email address and a screenshot of the issue for a faster response.`,
    portfolio: `# Creator Portfolio\n\nWelcome! I am the creator and developer of PassAsistant.\n\n## Profile\n- **Name**: Alex Johnson\n- **Role**: Founder & Lead Developer\n- **Email**: contact@prepai.com\n- **Socials**: [GitHub](https://github.com) | [LinkedIn](https://linkedin.com)\n\n## Background\nI am a passionate software engineer specializing in AI applications and modern web technologies. I built PassAsistant to help students prepare for IELTS, TOEFL, and TOEIC exams in an interactive, cost-effective way.\n\n## Technologies\n- **Frontend**: React, TypeScript, TanStack Router, TailwindCSS\n- **Backend**: Supabase, PostgreSQL, Edge Functions\n- **AI Integrations**: Gemini API, Web Audio API analysis\n- **Styling**: Vanilla CSS, Tailwind v4\n\n## PassAsistant Project\nPassAsistant leverages cutting-edge natural language processing to grade essays and evaluate speaking response pronunciation instantly. My goal is to make premium tutoring accessible to everyone, everywhere.`,
  };

  const pageNames = {
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    about: "About Us",
    contact: "Contact Us",
    portfolio: "Creator Portfolio",
  };

  useEffect(() => {
    if (activeTab !== "pages") return;

    async function loadPageContent() {
      setPageLoading(true);
      setPageSaveMessage("");
      try {
        const { data, error } = await (supabase as any)
          .from("site_pages")
          .select("*")
          .eq("slug", selectedPage)
          .maybeSingle();

        if (data && !error) {
          setPageTitle(data.title);
          setPageContent(data.content);
        } else {
          const localContent = localStorage.getItem(`prepai_page_content_${selectedPage}`);
          const localTitle = localStorage.getItem(`prepai_page_title_${selectedPage}`);
          if (localContent) {
            setPageContent(localContent);
            setPageTitle(localTitle || pageNames[selectedPage]);
          } else {
            setPageContent(DEFAULT_PAGES_CONTENT[selectedPage]);
            setPageTitle(pageNames[selectedPage]);
          }
        }
      } catch (err) {
        console.warn("Error loading page content:", err);
      } finally {
        setPageLoading(false);
      }
    }

    loadPageContent();
  }, [selectedPage, activeTab]);

  const savePageContent = async (title: string, content: string) => {
    setIsSavingPage(true);
    setPageSaveMessage("Saving content...");

    try {
      const { data: existing, error: checkError } = await (supabase as any)
        .from("site_pages")
        .select("id")
        .eq("slug", selectedPage)
        .maybeSingle();

      let dbError = null;
      if (existing) {
        const { error } = await (supabase as any)
          .from("site_pages")
          .update({
            title: title,
            content: content,
            updated_at: new Date().toISOString(),
          })
          .eq("slug", selectedPage);
        dbError = error;
      } else {
        const { error } = await (supabase as any).from("site_pages").insert({
          slug: selectedPage,
          title: title,
          content: content,
          updated_at: new Date().toISOString(),
        });
        dbError = error;
      }

      if (dbError) {
        console.warn("DB save failed, falling back to localStorage:", dbError.message);
        localStorage.setItem(`prepai_page_content_${selectedPage}`, content);
        localStorage.setItem(`prepai_page_title_${selectedPage}`, title);
        setPageSaveMessage("Saved locally! Run setup_pages.sql to enable DB persistence.");
      } else {
        setPageSaveMessage("Successfully saved to database!");
      }
    } catch (err) {
      console.error("Failed to save page:", err);
      setPageSaveMessage("Error saving page content.");
    } finally {
      setIsSavingPage(false);
      setTimeout(() => setPageSaveMessage(""), 4000);
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to save these page changes?")) {
      return;
    }
    await savePageContent(pageTitle, pageContent);
  };

  // Stats state
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [pageSize, setPageSize] = useState<string>("10");
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Dynamic Categories state
  const [categories, setCategories] = useState<any[]>(STATIC_CATEGORIES);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [categoryEditMessage, setCategoryEditMessage] = useState("");

  // AI Assistant state
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    {
      role: "assistant",
      text: "Hello! I am your PassAsistant Admin Assistant. How can I help you manage your course materials, write descriptions, or organize outline chapters today?",
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  // AI Outline state
  const [isAiGeneratingOutline, setIsAiGeneratingOutline] = useState(false);

  // Upload Form state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("ielts");
  const [type, setType] = useState("tips");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // Editing state
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("ielts");
  const [editType, setEditType] = useState("tips");
  const [editDifficulty, setEditDifficulty] = useState("intermediate");
  const [editChapters, setEditChapters] = useState<{ id: string; title: string; page: number }[]>(
    [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [editMessage, setEditMessage] = useState("");

  // Sorting state
  const [sortField, setSortField] = useState<"title" | "category" | "type" | "created_at">(
    "created_at",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: "title" | "category" | "type" | "created_at") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedResources = [...resources].sort((a, b) => {
    if (sortField === "created_at") {
      const valA = new Date(a.created_at || 0).getTime();
      const valB = new Date(b.created_at || 0).getTime();
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }
    const fieldA = (a[sortField] || "").toString().toLowerCase();
    const fieldB = (b[sortField] || "").toString().toLowerCase();
    if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const filteredResources = sortedResources.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const catName = categories.find((c) => c.id === r.category)?.name || r.category;
    return (
      (r.title || "").toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      (catName || "").toLowerCase().includes(q) ||
      (r.type || "").toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (pageSize === "all") {
      setVisibleCount(filteredResources.length);
    } else {
      setVisibleCount(parseInt(pageSize));
    }
  }, [searchQuery, pageSize, filteredResources.length]);

  const fetchCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        console.warn("Failed to fetch categories, falling back to static:", error.message);
        const stored = localStorage.getItem("prepai_custom_categories");
        if (stored) {
          setCategories(JSON.parse(stored));
        } else {
          setCategories(STATIC_CATEGORIES);
        }
      } else if (data && data.length > 0) {
        setCategories(data);
      } else {
        setCategories(STATIC_CATEGORIES);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      setCategories(STATIC_CATEGORIES);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchResources();
      fetchCategories();
    }
  }, [isAdmin]);

  const fetchResources = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setResources(data);
    }
    setIsLoading(false);
  };

  const startEdit = async (resource: any) => {
    setEditingResource(resource);
    setEditTitle(resource.title);
    setEditDescription(resource.description);
    setEditCategory(resource.category);
    setEditType(resource.type);
    setEditDifficulty(resource.difficulty || "intermediate");
    setEditMessage("");
    setEditChapters([]);

    // Fetch chapters from courses table
    const { data, error } = await supabase
      .from("courses")
      .select("chapters_json")
      .eq("resource_id", resource.id)
      .maybeSingle();

    if (!error && data && Array.isArray(data.chapters_json)) {
      setEditChapters(data.chapters_json as any[]);
    } else {
      setEditChapters([{ id: "ch1", title: "Document Start", page: 1 }]);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    if (!window.confirm("Are you sure you want to save these resource changes?")) {
      return;
    }

    setIsSaving(true);
    setEditMessage("Saving updates...");

    // 1. Update resources table
    const { error: resError } = await supabase
      .from("resources")
      .update({
        title: editTitle,
        description: editDescription,
        category: editCategory,
        type: editType,
        difficulty: editDifficulty,
      })
      .eq("id", editingResource.id);

    if (resError) {
      setEditMessage(`Failed to update resource: ${resError.message}`);
      setIsSaving(false);
      return;
    }

    // 2. Update courses table
    const { error: courseError } = await supabase
      .from("courses")
      .update({
        title: editTitle,
        description: editDescription,
        chapters_json: editChapters,
      })
      .eq("resource_id", editingResource.id);

    if (courseError) {
      setEditMessage(`Failed to update course details: ${courseError.message}`);
    } else {
      setEditMessage("Resource successfully updated!");
      fetchResources();
      setTimeout(() => {
        setEditingResource(null);
      }, 1000);
    }

    setIsSaving(false);
  };

  const handleDelete = async (resource: any) => {
    if (
      !confirm(
        `Are you sure you want to delete "${resource.title}"? This will permanently delete the resource, course outline, and the PDF file from storage.`,
      )
    ) {
      return;
    }

    try {
      // 1. Delete from resources database (cascades to courses table)
      const { error: dbError } = await supabase.from("resources").delete().eq("id", resource.id);

      if (dbError) {
        alert(`Failed to delete database record: ${dbError.message}`);
        return;
      }

      // 2. Delete PDF from Storage
      if (resource.url) {
        const { error: storageError } = await supabase.storage.from("pdfs").remove([resource.url]);
        if (storageError) {
          console.error("Failed to delete file from storage bucket:", storageError.message);
        }
      }

      fetchResources();
    } catch (err) {
      console.error("Error during deletion:", err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadMessage("Please select a PDF file first.");
      return;
    }

    setIsUploading(true);
    setUploadMessage("Uploading file to Storage...");

    const fileExt = file.name.split(".").pop();
    const fileName = `${category}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    // 1. Upload to Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from("pdfs")
      .upload(fileName, file, {
        upsert: false,
        contentType: "application/pdf",
      });

    if (storageError) {
      setUploadMessage(`Upload failed: ${storageError.message}`);
      setIsUploading(false);
      return;
    }

    setUploadMessage("File uploaded. Saving database record...");

    // 2. Insert Resource Record
    const resourceId = `${category}-${Date.now()}`;
    const { error: dbError } = await supabase.from("resources").insert({
      id: resourceId,
      title,
      description,
      category,
      difficulty,
      type,
      url: fileName, // Store relative storage path
    });

    if (dbError) {
      setUploadMessage(`Database error: ${dbError.message}`);
      setIsUploading(false);
      return;
    }

    // 3. Create a default Course record for the viewer
    const { error: courseError } = await supabase.from("courses").insert({
      id: resourceId,
      resource_id: resourceId,
      title,
      description,
      pdf_url: fileName, // Store relative storage path
      chapters_json: [{ id: "ch1", title: "Document Start", page: 1 }],
    });

    if (courseError) {
      setUploadMessage(`Course creation error: ${courseError.message}`);
    } else {
      setUploadMessage("Success! Resource added.");
      // Reset form
      setFile(null);
      setTitle("");
      setDescription("");
      fetchResources();
      setTimeout(() => {
        setActiveTab("resources");
        setUploadMessage("");
      }, 2000);
    }

    setIsUploading(false);
  };

  const handleRenameCategory = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    setCategoryEditMessage("Updating category name...");

    // 1. Try DB
    const { error } = await supabase.from("categories").update({ name: newName }).eq("id", id);

    if (error) {
      console.warn("Failed to update in DB, updating in localStorage:", error.message);
      const updated = categories.map((c) => (c.id === id ? { ...c, name: newName } : c));
      setCategories(updated);
      localStorage.setItem("prepai_custom_categories", JSON.stringify(updated));
      setCategoryEditMessage(
        "Category name updated locally! (Run setup_categories.sql to persist in DB)",
      );
    } else {
      setCategoryEditMessage("Category name successfully updated!");
      fetchCategories();
    }

    setTimeout(() => setCategoryEditMessage(""), 3000);
  };

  const handleMoveCategory = async (id: string, direction: "up" | "down") => {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === categories.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const newCategories = [...categories];

    // Swap sort_order
    const tempOrder = newCategories[idx].sort_order;
    newCategories[idx].sort_order = newCategories[targetIdx].sort_order;
    newCategories[targetIdx].sort_order = tempOrder;

    // Swap items in local array
    const tempItem = newCategories[idx];
    newCategories[idx] = newCategories[targetIdx];
    newCategories[targetIdx] = tempItem;

    setCategoryEditMessage("Saving category order...");

    // 1. Try DB update
    const { error: err1 } = await supabase
      .from("categories")
      .update({ sort_order: newCategories[idx].sort_order })
      .eq("id", newCategories[idx].id);

    const { error: err2 } = await supabase
      .from("categories")
      .update({ sort_order: newCategories[targetIdx].sort_order })
      .eq("id", newCategories[targetIdx].id);

    if (err1 || err2) {
      console.warn("Failed to update order in DB, updating in localStorage");
      const sorted = [...newCategories].sort((a, b) => a.sort_order - b.sort_order);
      setCategories(sorted);
      localStorage.setItem("prepai_custom_categories", JSON.stringify(sorted));
      setCategoryEditMessage(
        "Category order updated locally! (Run setup_categories.sql to persist in DB)",
      );
    } else {
      setCategoryEditMessage("Category order successfully updated!");
      fetchCategories();
    }

    setTimeout(() => setCategoryEditMessage(""), 3000);
  };

  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiTyping) return;

    const userPrompt = aiInput.trim();
    setAiInput("");
    setAiMessages((prev) => [...prev, { role: "user", text: userPrompt }]);
    setIsAiTyping(true);

    try {
      const responseObj = await getAdminAiHelper({
        data: {
          prompt: userPrompt,
          context: `Current system has ${resources.length} resources. Categories available: ${categories.map((c) => c.name).join(", ")}`,
        },
      });

      setAiMessages((prev) => [...prev, { role: "assistant", text: responseObj.response }]);
    } catch (err) {
      console.error("AI assistant error:", err);
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I'm sorry, I encountered an error trying to process your request. Please check if GEMINI_API_KEY is configured.",
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleGenerateChaptersWithAi = async (isEditMode: boolean) => {
    const t = isEditMode ? editTitle : title;
    const d = isEditMode ? editDescription : description;

    if (!t) {
      alert("Please fill in the title first so the AI has context.");
      return;
    }

    setIsAiGeneratingOutline(true);
    const outlinePrompt = `Analyze this resource title: "${t}" and description: "${d}". Suggest a course chapter outline for it. Generate 3 to 10 logical chapters depending on the depth. Output must be a valid JSON array of objects, with each object having exactly 'id' (string, e.g. ch1, ch2), 'title' (string, chapter name), and 'page' (integer, a logical starting page number starting from 1 or later). Return ONLY the raw JSON array. DO NOT wrap it in markdown block code or add any commentary.`;

    try {
      const responseObj = await getAdminAiHelper({
        data: { prompt: outlinePrompt },
      });

      let cleanedJson = responseObj.response.trim();
      if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson
          .replace(/^```json\s*/, "")
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      const parsed = JSON.parse(cleanedJson);
      if (Array.isArray(parsed)) {
        if (isEditMode) {
          setEditChapters(parsed);
          alert(
            "Successfully generated " + parsed.length + " chapters! Check the chapters list below.",
          );
        }
      } else {
        throw new Error("Response is not an array");
      }
    } catch (err) {
      console.error("AI Outline Generation failed:", err);
      alert(
        "Failed to auto-generate outline. AI did not return a valid JSON array. Please try again or create chapters manually.",
      );
    } finally {
      setIsAiGeneratingOutline(false);
    }
  };

  if (authLoading) {
    return (
      <AppShell>
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="size-8 animate-spin mb-4 opacity-50 text-accent" />
          <p>Verifying admin permissions...</p>
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto py-20 text-center">
          <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">You do not have administrative permissions.</p>
          <Button asChild variant="outline">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <PageHeader
          eyebrow="Management"
          title="Admin Panel"
          description="Manage learning resources, upload new PDFs, and organize courses."
        />

        {/* Admin Navigation */}
        <div className="flex gap-2 border-b border-border mb-8 pb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab("resources")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "resources"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="size-4" />
              Manage Resources
            </div>
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "upload"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <Upload className="size-4" />
              Upload PDF
            </div>
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "categories"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="size-4" />
              Manage Categories
            </div>
          </button>
          <button
            onClick={() => setActiveTab("pages")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "pages"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="size-4" />
              Edit Pages
            </div>
          </button>
          <button
            onClick={() => setActiveTab("topics")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "topics"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <PenLine className="size-4" />
              Manage Topics
            </div>
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "ai"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4" />
              AI Assistant
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "resources" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap flex-1">
                <h3 className="font-semibold text-lg">
                  Published Resources{" "}
                  {searchQuery.trim()
                    ? `(${filteredResources.length} found / ${resources.length} total)`
                    : `(${resources.length})`}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border px-3 py-1.5 rounded-lg shadow-sm">
                  <span>Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(e.target.value);
                    }}
                    className="bg-transparent font-medium text-foreground outline-none cursor-pointer"
                  >
                    <option value="10">10 items</option>
                    <option value="50">50 items</option>
                    <option value="100">100 items</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-7 py-1.5 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                <Button onClick={() => setActiveTab("upload")} size="sm" className="gap-2 shrink-0">
                  <Plus className="size-4" /> Add Resource
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="size-8 animate-spin mb-4 opacity-50" />
                <p>Loading resources from Supabase...</p>
              </div>
            ) : resources.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 flex flex-col items-center justify-center text-center">
                <AlertCircle className="size-10 text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-medium text-lg mb-1">No resources found</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  It looks like the database is empty or the migration hasn't run yet. Upload a PDF
                  or run the migration script to populate this list.
                </p>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 flex flex-col items-center justify-center text-center bg-card">
                <Search className="size-10 text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-medium text-lg mb-1">No matches found</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  We couldn't find any resources matching your search term "{searchQuery}". Try
                  editing your query!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
                      <tr>
                        <th
                          onClick={() => handleSort("title")}
                          className="px-6 py-3 font-medium cursor-pointer select-none hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            Title
                            {sortField === "title" &&
                              (sortOrder === "asc" ? (
                                <ArrowUp className="size-3" />
                              ) : (
                                <ArrowDown className="size-3" />
                              ))}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("category")}
                          className="px-6 py-3 font-medium cursor-pointer select-none hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            Category
                            {sortField === "category" &&
                              (sortOrder === "asc" ? (
                                <ArrowUp className="size-3" />
                              ) : (
                                <ArrowDown className="size-3" />
                              ))}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("type")}
                          className="px-6 py-3 font-medium cursor-pointer select-none hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            Type
                            {sortField === "type" &&
                              (sortOrder === "asc" ? (
                                <ArrowUp className="size-3" />
                              ) : (
                                <ArrowDown className="size-3" />
                              ))}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("created_at")}
                          className="px-6 py-3 font-medium cursor-pointer select-none hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            Date Added
                            {sortField === "created_at" &&
                              (sortOrder === "asc" ? (
                                <ArrowUp className="size-3" />
                              ) : (
                                <ArrowDown className="size-3" />
                              ))}
                          </div>
                        </th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredResources.slice(0, visibleCount).map((r) => (
                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium">{r.title}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-accent/10 text-accent border border-accent/20">
                              {categories.find((c) => c.id === r.category)?.name || r.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground capitalize">{r.type}</td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {r.created_at
                              ? new Date(r.created_at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <Link
                                to="/courses/$courseId"
                                params={{ courseId: r.id }}
                                search={{ from: "/admin" }}
                                className="text-accent hover:underline text-xs font-medium"
                              >
                                View
                              </Link>
                              <button
                                onClick={() => startEdit(r)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title="Edit Resource"
                              >
                                <Edit2 className="size-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(r)}
                                className="text-destructive hover:text-destructive/80 transition-colors"
                                title="Delete Resource"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {visibleCount < filteredResources.length && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setVisibleCount((prev) =>
                          Math.min(
                            prev + parseInt(pageSize === "all" ? "10" : pageSize),
                            filteredResources.length,
                          ),
                        )
                      }
                      className="gap-2"
                    >
                      Load More ({filteredResources.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "upload" && (
          <div className="max-w-2xl">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-lg mb-6">Upload New Resource</h3>

              <form onSubmit={handleUpload} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">PDF File</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-foreground hover:file:bg-accent/90 bg-muted/50 rounded-md border border-border cursor-pointer"
                    required
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="e.g. Master IELTS Reading"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 min-h-[80px]"
                      placeholder="A short description of the material..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-6 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{uploadMessage}</span>
                  <Button type="submit" disabled={isUploading || !file} className="gap-2">
                    {isUploading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    {isUploading ? "Uploading..." : "Upload Resource"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="space-y-6 max-w-4xl">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-lg mb-2">Category Management</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Rename or change the sort order of resource categories. Changes are saved to
                Supabase (with localStorage fallback).
              </p>

              {categoryEditMessage && (
                <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm flex items-center gap-2">
                  <AlertCircle className="size-4" />
                  <span>{categoryEditMessage}</span>
                </div>
              )}

              {isCategoriesLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="size-8 animate-spin mb-4 opacity-50 text-accent" />
                  <p>Loading categories...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((c, index) => (
                    <CategoryRow
                      key={c.id}
                      category={c}
                      index={index}
                      total={categories.length}
                      onRename={(newName) => handleRenameCategory(c.id, newName)}
                      onMove={(direction) => handleMoveCategory(c.id, direction)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="space-y-6 max-w-4xl">
            <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[600px]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">AI Admin Helper</h3>
                  <p className="text-muted-foreground text-xs">
                    Powered by Gemini. Help with drafting descriptions, chapters, or planning
                    resources.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                  <Sparkles className="size-3 animate-pulse" />
                  <span>Gemini Active</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === "user"
                          ? "bg-accent text-accent-foreground rounded-tr-none"
                          : "bg-muted/80 text-foreground border border-border rounded-tl-none"
                      } whitespace-pre-wrap`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted/80 border border-border rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin text-accent" />
                      <span>PassAsistant Helper is thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestion Chips */}
              <div className="px-6 py-2 border-t border-border bg-muted/10 flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground">Try asking:</span>
                <button
                  type="button"
                  onClick={() =>
                    setAiInput(
                      "Help me draft a course outline for 'IELTS Writing Task 2 Masterclass'.",
                    )
                  }
                  className="text-xs px-2.5 py-1 rounded-full bg-background border hover:bg-muted transition-colors text-left"
                >
                  Draft Writing outline
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAiInput("Write a premium description for 'Advanced TOEFL Listening Guide'.")
                  }
                  className="text-xs px-2.5 py-1 rounded-full bg-background border hover:bg-muted transition-colors text-left"
                >
                  Draft TOEFL description
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAiInput("How can I structure chapters for a beginner Reading Quiz resource?")
                  }
                  className="text-xs px-2.5 py-1 rounded-full bg-background border hover:bg-muted transition-colors text-left"
                >
                  Beginner Quiz structure
                </button>
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendAiMessage}
                className="p-4 border-t border-border bg-background flex gap-2"
              >
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask anything (e.g. 'Generate description for IELTS Academic prep'...)"
                  className="flex-1 px-4 py-2 text-sm rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  disabled={isAiTyping}
                />
                <Button type="submit" disabled={isAiTyping || !aiInput.trim()} className="gap-1.5">
                  <Send className="size-4" />
                  <span>Send</span>
                </Button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "pages" && (
          <div className="space-y-6 max-w-4xl font-sans animate-in fade-in duration-200">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold text-lg mb-2">Edit Site Pages</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Modify the content of public pages such as Privacy Policy, Terms of Service, About
                Us, and Contact Us. (Markdown is supported)
              </p>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar list of pages */}
                <div className="w-full md:w-48 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                  {Object.entries(pageNames).map(([slug, name]) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => setSelectedPage(slug as any)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors whitespace-nowrap ${
                        selectedPage === slug
                          ? "bg-accent/10 text-accent border border-accent/20"
                          : "bg-background border border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>

                {/* Content Editor */}
                <div className="flex-1">
                  {pageLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                      <Loader2 className="size-8 animate-spin mb-4 opacity-50 text-accent" />
                      <p>Loading page content...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSavePage} className="space-y-4">
                      {selectedPage === "portfolio" && (
                        <div className="rounded-xl border border-border bg-muted/20 p-4 mb-4">
                          <label className="block text-sm font-semibold mb-2">
                            Profile Image (Avatar)
                          </label>
                          <div className="flex flex-wrap items-center gap-4">
                            {(() => {
                              const match = pageContent.match(/^-\s+\*\*avatar\*\*:\s*(.*)$/im);
                              const currentAvatarUrl = match && match[1] ? match[1].trim() : "";
                              return (
                                <>
                                  {resolvedAvatarUrl ? (
                                    <div className="relative group">
                                      <img
                                        src={resolvedAvatarUrl}
                                        alt="Current Avatar"
                                        className="size-32 rounded-full object-cover border-2 border-accent/20 shadow-md"
                                      />
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (
                                            confirm(
                                              "Are you sure you want to remove the profile image?",
                                            )
                                          ) {
                                            const storagePrefix = "/public/pdfs/";
                                            const idx = currentAvatarUrl.indexOf(storagePrefix);
                                            if (idx !== -1) {
                                              const path = currentAvatarUrl.substring(
                                                idx + storagePrefix.length,
                                              );
                                              await supabase.storage.from("pdfs").remove([path]);
                                            }
                                            const newContent = pageContent.replace(
                                              /^-\s+\*\*avatar\*\*:\s*.*$\n?/im,
                                              "",
                                            );
                                            setPageContent(newContent);
                                            await savePageContent(pageTitle, newContent);
                                          }
                                        }}
                                        className="absolute top-0 right-0 size-7.5 rounded-full bg-destructive text-white flex items-center justify-center shadow hover:bg-destructive/80 transition-colors cursor-pointer border-2 border-background"
                                        title="Remove Image"
                                      >
                                        <X className="size-4.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="size-32 rounded-full bg-card border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs font-semibold text-center p-1">
                                      No Image
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-[200px]">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      id="avatar-upload"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const fileList = e.target.files;
                                        if (!fileList || fileList.length === 0) return;
                                        const selectedFile = fileList[0];

                                        setPageSaveMessage("Uploading image...");
                                        try {
                                          const ext = selectedFile.name.split(".").pop();
                                          const path = `portfolio/avatar-${Date.now()}.${ext}`;

                                          const { error } = await supabase.storage
                                            .from("pdfs")
                                            .upload(path, selectedFile, {
                                              upsert: true,
                                            });

                                          if (error) throw error;

                                          const { data: urlData } = supabase.storage
                                            .from("pdfs")
                                            .getPublicUrl(path);

                                          const publicUrl = urlData.publicUrl;

                                          const avatarRegex = /^-\s+\*\*avatar\*\*:\s*(.*)$/im;
                                          let newContent = pageContent;
                                          if (avatarRegex.test(pageContent)) {
                                            newContent = pageContent.replace(
                                              avatarRegex,
                                              `- **Avatar**: ${publicUrl}`,
                                            );
                                          } else if (pageContent.includes("## Profile")) {
                                            newContent = pageContent.replace(
                                              "## Profile",
                                              `## Profile\n- **Avatar**: ${publicUrl}`,
                                            );
                                          } else {
                                            newContent =
                                              pageContent + `\n\n- **Avatar**: ${publicUrl}`;
                                          }

                                          setPageContent(newContent);
                                          await savePageContent(pageTitle, newContent);
                                        } catch (err: any) {
                                          console.error("Avatar upload failed:", err);
                                          setPageSaveMessage(
                                            `Upload failed: ${err.message || err}`,
                                          );
                                        }
                                      }}
                                    />
                                    <label htmlFor="avatar-upload">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        className="cursor-pointer"
                                      >
                                        <span>Choose Profile Image</span>
                                      </Button>
                                    </label>
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                      Supports PNG, JPG, WEBP. Uploaded to secure Supabase storage.
                                    </p>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Page Title</label>
                        <input
                          type="text"
                          value={pageTitle}
                          onChange={(e) => setPageTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">
                          Page Content (Markdown)
                        </label>
                        <textarea
                          value={pageContent}
                          onChange={(e) => setPageContent(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm font-mono min-h-[350px] leading-relaxed"
                          required
                          placeholder="# Write your markdown content here..."
                        />
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">
                          {pageSaveMessage}
                        </span>
                        <Button type="submit" disabled={isSavingPage} className="gap-2">
                          {isSavingPage ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Plus className="size-4" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "topics" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Manage Topics Bank</h3>
                <p className="text-muted-foreground text-sm">
                  Add, update, or remove prompts for Speaking and Writing tests. (Cached fallback applies when DB table is empty).
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingTopic(null);
                  setTopicPromptText("");
                  setTopicImageUrl("");
                  setTopicExam("ielts_speaking");
                  setTopicPart("part1");
                  setTopicsMessage("");
                  setShowTopicModal(true);
                }}
                className="gap-2 shrink-0 self-start md:self-auto"
              >
                <Plus className="size-4" /> Add Custom Topic
              </Button>
            </div>

            {/* Filter Panel */}
            <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-wrap gap-4 items-center">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Filter by Exam</label>
                <select
                  value={filterExam}
                  onChange={(e) => {
                    const examVal = e.target.value;
                    setFilterExam(examVal);
                    const examDef = EXAM_TOPIC_TYPES[examVal];
                    if (examDef && examDef.parts.length > 0) {
                      setFilterPart(examDef.parts[0].value);
                    }
                  }}
                  className="w-48 px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent text-sm"
                >
                  {Object.entries(EXAM_TOPIC_TYPES).map(([val, obj]) => (
                    <option key={val} value={val}>
                      {obj.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Filter by Section / Part</label>
                <select
                  value={filterPart}
                  onChange={(e) => setFilterPart(e.target.value)}
                  className="w-56 px-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent text-sm"
                >
                  {(EXAM_TOPIC_TYPES[filterExam]?.parts || []).map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">Search Prompt Text</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={topicsSearchQuery}
                    onChange={(e) => setTopicsSearchQuery(e.target.value)}
                    placeholder="Search topics..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Topics List */}
            {isTopicsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="size-8 animate-spin mb-4 opacity-50 text-accent" />
                <p>Loading database topics...</p>
              </div>
            ) : (() => {
              const filtered = dbTopics.filter((t) => {
                const matchesExam = t.exam === filterExam;
                const matchesPart = t.part === filterPart;
                const matchesSearch = !topicsSearchQuery.trim() || t.prompt_text.toLowerCase().includes(topicsSearchQuery.toLowerCase());
                return matchesExam && matchesPart && matchesSearch;
              });

              return (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  {filtered.length === 0 ? (
                    <div className="p-12 text-center">
                      <AlertCircle className="size-10 text-muted-foreground mx-auto mb-4 opacity-40" />
                      <h4 className="font-medium text-base mb-1">No custom topics found</h4>
                      <p className="text-muted-foreground text-xs max-w-md mx-auto">
                        There are no live database topics for this selection yet. Default hardcoded topics from topic-bank.ts will be used.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-6 py-3 font-medium">Prompt Question / Text</th>
                          <th className="px-6 py-3 font-medium w-48">Image URL (Task 1)</th>
                          <th className="px-6 py-3 font-medium text-right w-36">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filtered.map((t) => (
                          <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 font-normal max-w-lg">
                              <span className="line-clamp-2" title={t.prompt_text}>
                                {t.prompt_text}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-muted-foreground max-w-[12rem] truncate">
                              {t.image_url ? (
                                <a href={t.image_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                                  {t.image_url}
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => {
                                    setEditingTopic(t);
                                    setTopicPromptText(t.prompt_text);
                                    setTopicImageUrl(t.image_url || "");
                                    setTopicExam(t.exam);
                                    setTopicPart(t.part);
                                    setTopicsMessage("");
                                    setShowTopicModal(true);
                                  }}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  title="Edit Topic"
                                >
                                  <Edit2 className="size-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTopic(t.id)}
                                  className="text-destructive hover:text-destructive/80 transition-colors"
                                  title="Delete Topic"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Edit / Add Topic Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-lg">{editingTopic ? "Edit Topic" : "Add Custom Topic"}</h3>
              <button
                onClick={() => setShowTopicModal(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSaveTopic} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Exam Type</label>
                  <select
                    value={topicExam}
                    onChange={(e) => {
                      const examVal = e.target.value;
                      setTopicExam(examVal);
                      const examDef = EXAM_TOPIC_TYPES[examVal];
                      if (examDef && examDef.parts.length > 0) {
                        setTopicPart(examDef.parts[0].value);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                  >
                    {Object.entries(EXAM_TOPIC_TYPES).map(([val, obj]) => (
                      <option key={val} value={val}>
                        {obj.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Section / Part</label>
                  <select
                    value={topicPart}
                    onChange={(e) => setTopicPart(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                  >
                    {(EXAM_TOPIC_TYPES[topicExam]?.parts || []).map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Prompt Question / Text</label>
                  <textarea
                    value={topicPromptText}
                    onChange={(e) => setTopicPromptText(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm min-h-[120px]"
                    placeholder="Enter the full question or writing/speaking prompt..."
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Image URL (Optional)</label>
                  <input
                    type="text"
                    value={topicImageUrl}
                    onChange={(e) => setTopicImageUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                    placeholder="e.g. https://www.example.com/charts/graph1.png"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Mainly used for IELTS Academic Writing Task 1 visual materials.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-between mt-6">
                <span className="text-xs text-muted-foreground">{topicsMessage}</span>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowTopicModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSavingTopic}>
                    {isSavingTopic && <Loader2 className="size-4 animate-spin mr-1.5" />}
                    Save Topic
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resource & Chapters Outline Modal */}
      {editingResource && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-lg">Edit Resource & Chapter Outline</h3>
              <button
                onClick={() => setEditingResource(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm min-h-[70px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Difficulty</label>
                  <select
                    value={editDifficulty}
                    onChange={(e) => setEditDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Chapters List Editor */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">Course Chapters Outline</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateChaptersWithAi(true)}
                      disabled={isAiGeneratingOutline}
                      className="gap-1 text-xs border-accent/30 text-accent hover:bg-accent/5"
                    >
                      {isAiGeneratingOutline ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Sparkles className="size-3" />
                      )}
                      {isAiGeneratingOutline ? "Generating..." : "Generate Outline with AI"}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditChapters([
                        ...editChapters,
                        {
                          id: `ch-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                          title: "",
                          page: 1,
                        },
                      ])
                    }
                    className="gap-1 text-xs"
                  >
                    <Plus className="size-3.5" /> Add Chapter
                  </Button>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {editChapters.map((ch, idx) => (
                    <div key={ch.id} className="flex gap-2 items-center">
                      <span className="text-xs font-semibold text-muted-foreground w-8">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Chapter Title"
                        value={ch.title}
                        onChange={(e) => {
                          const updated = [...editChapters];
                          updated[idx].title = e.target.value;
                          setEditChapters(updated);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Page"
                        value={ch.page}
                        onChange={(e) => {
                          const updated = [...editChapters];
                          updated[idx].page = parseInt(e.target.value) || 1;
                          setEditChapters(updated);
                        }}
                        className="w-20 px-3 py-1.5 text-xs rounded-md border border-border bg-background text-center focus:outline-none focus:ring-2 focus:ring-accent/50"
                        min="1"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const updated = editChapters.filter((_, cidx) => cidx !== idx);
                          setEditChapters(updated);
                        }}
                        disabled={editChapters.length <= 1}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{editMessage}</span>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingResource(null)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
