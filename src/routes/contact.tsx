import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import {
  Moon,
  Sun,
  ArrowLeft,
  Loader2,
  Send,
  Mail,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — PassAssist" },
      {
        name: "description",
        content:
          "Get in touch with the PassAssist team. We are here to help with your English exam preparation support.",
      },
    ],
  }),
  component: ContactPage,
});

const DEFAULT_CONTENT = `# Contact Us

Have questions, feedback, or need assistance? We are here to help!

### Contact Details
- **Email**: support@prepai.com
- **Phone**: +1 (800) 555-0199
- **Office Hours**: 9:00 AM – 5:00 PM EST
- **Location**: San Francisco, CA

### Email Integration (Web3Forms)
To make the contact form work, get a free Access Key from [Web3Forms](https://web3forms.com) and paste it below:
- **Web3Forms Key**: YOUR_ACCESS_KEY_HERE

### Guidelines
For account support or bugs, please include your email address and a screenshot of the issue for a faster response.`;

function extractContactDetails(markdown: string) {
  const getMatch = (regex: RegExp) => {
    const match = markdown.match(regex);
    return match ? match[1].trim() : "";
  };

  return {
    email: getMatch(/-\s*\*\*.*?Email\*\*:\s*(.+)/i) || "support@prepai.com",
    phone: getMatch(/-\s*\*\*.*?Phone\*\*:\s*(.+)/i) || "+1 (800) 555-0199",
    hours: getMatch(/-\s*\*\*.*?Hours\*\*:\s*(.+)/i) || "9:00 AM – 5:00 PM EST",
    location: getMatch(/-\s*\*\*.*?Location\*\*:\s*(.+)/i) || "San Francisco, CA",
    web3formsKey: getMatch(/-\s*\*\*.*?Web3Forms Key\*\*:\s*(.+)/i),
  };
}

/* ------------------------------------------------------------------ */
/*  FAQ data                                                          */
/* ------------------------------------------------------------------ */
const FAQS = [
  {
    q: "How quickly will I get a response?",
    a: "Our support team typically responds within 24 hours on business days. Priority issues are addressed within 4 hours.",
  },
  {
    q: "Can I schedule a live demo?",
    a: 'Absolutely! Mention "live demo" in the subject line and we\'ll set up a personalized walkthrough for you.',
  },
  {
    q: "Is there phone support available?",
    a: "Phone support is available Monday through Friday, 9 AM to 5 PM EST for all premium plan members.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                    */
/* ------------------------------------------------------------------ */
export function ContactPage() {
  const { theme, toggle } = useTheme();
  const [title, setTitle] = useState("Contact Us");
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadPage() {
      try {
        const { data, error } = await (supabase as any)
          .from("site_pages")
          .select("*")
          .eq("slug", "contact")
          .maybeSingle();

        if (data && !error) {
          setTitle(data.title);
          setContent(data.content);
        } else {
          const localContent = localStorage.getItem("prepai_page_content_contact");
          const localTitle = localStorage.getItem("prepai_page_title_contact");
          if (localContent) {
            setContent(localContent);
            setTitle(localTitle || "Contact Us");
          }
        }
      } catch (err) {
        console.warn("Failed to load page from database/localStorage:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPage();
  }, []);

  const details = extractContactDetails(content);

  const contactCards = [
    {
      icon: Mail,
      label: "Email Us",
      value: details.email,
      sub: "We reply within 24 hours",
    },
    {
      icon: Phone,
      label: "Call Us",
      value: details.phone,
      sub: "Mon–Fri",
    },
    {
      icon: Clock,
      label: "Office Hours",
      value: details.hours,
      sub: "Eastern Standard Time",
    },
    {
      icon: MapPin,
      label: "Location",
      value: details.location,
      sub: "Headquarters",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!details.web3formsKey || details.web3formsKey === "YOUR_ACCESS_KEY_HERE") {
      toast.error("Form is not connected to an email service. Please add your Web3Forms Key in the Admin Panel.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: details.web3formsKey,
          name,
          email,
          subject,
          message,
        }),
      });
      
      const result = await response.json();
      if (response.status === 200) {
        toast.success("Message sent successfully! We will get back to you shortly.");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        toast.error(result.message || "Failed to send message. Please try again.");
      }
    } catch (err) {
      toast.error("An error occurred while sending the message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */
  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col font-sans">
      {/* ───────── Header ───────── */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-lg font-bold tracking-tight transition-colors group-hover:opacity-80">
              Pass<span className="text-accent">Assist</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Home</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden isolate">
        {/* Gradient backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-accent/10 via-background to-accent/5"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 -z-10 h-72 w-72 rounded-full bg-accent/15 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/3 -z-10 h-56 w-56 rounded-full bg-accent/10 blur-[80px]"
        />

        <div className="max-w-6xl mx-auto px-6 pt-12 pb-14 md:pt-16 md:pb-20">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8 animate-[fadeInUp_0.5s_ease_both]"
          >
            <Link to="/" className="hover:text-accent transition-colors font-medium">
              Home
            </Link>
            <ChevronRight className="size-3.5 shrink-0 opacity-50" />
            <span className="text-foreground font-medium">Contact</span>
          </nav>

          <div className="max-w-2xl animate-[fadeInUp_0.6s_ease_both]">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent mb-4">
              <Sparkles className="size-3" />
              We&rsquo;d love to hear from you
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-accent bg-clip-text text-transparent leading-[1.1] mb-4">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              Have questions, feedback, or need assistance? Our team is standing by to help you
              succeed in your exam preparation journey.
            </p>
          </div>
        </div>
      </section>

      {/* ───────── Main ───────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 pb-20">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="size-10 animate-spin mb-4 text-accent opacity-60" />
            <p className="text-sm font-medium">Loading Contact page…</p>
          </div>
        ) : (
          <>
            {/* ── Contact Info Cards ── */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 -mt-8 md:-mt-10 relative z-10 animate-[fadeInUp_0.7s_ease_both]">
              {contactCards.map(({ icon: Icon, label, value, sub }) => (
                <div
                  key={label}
                  className="group rounded-2xl border border-border bg-card/80 backdrop-blur-md p-5 shadow-sm hover:shadow-lg hover:border-accent/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors duration-300">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                </div>
              ))}
            </section>

            {/* ── Two-column: Markdown + Form ── */}
            <div className="grid lg:grid-cols-5 gap-10 mt-16 items-start">
              {/* Left – markdown content */}
              <div className="lg:col-span-2 prose prose-sm dark:prose-invert max-w-none animate-[fadeInUp_0.8s_ease_both]">
                <SimpleMarkdown content={content} />
              </div>

              {/* Right – glassmorphism form card */}
              <div className="lg:col-span-3 animate-[fadeInUp_0.9s_ease_both]">
                <div className="relative rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 md:p-8 shadow-xl shadow-accent/[0.04]">
                  {/* Glow border accent */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-px rounded-3xl border border-accent/20 z-0"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-12 right-8 size-40 rounded-full bg-accent/10 blur-[60px] -z-10"
                  />

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                      <MessageSquare className="size-5 text-accent" />
                      <h3 className="text-xl font-bold tracking-tight">Send a Message</h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-8 pl-8">
                      Fill out the form below and our support team will reply within 24 hours.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Name */}
                      <div className="relative group/field">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 group-focus-within/field:text-accent transition-colors">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/70 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-200"
                          required
                        />
                      </div>

                      {/* Email */}
                      <div className="relative group/field">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 group-focus-within/field:text-accent transition-colors">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/70 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-200"
                          required
                        />
                      </div>

                      {/* Subject */}
                      <div className="relative group/field">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 group-focus-within/field:text-accent transition-colors">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="How can we help?"
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/70 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-200"
                          required
                        />
                      </div>

                      {/* Message */}
                      <div className="relative group/field">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 group-focus-within/field:text-accent transition-colors">
                          Message
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Write your message here…"
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/70 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-200 min-h-[130px] leading-relaxed resize-y"
                          required
                        />
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="relative w-full inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/80 shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none transition-all duration-200"
                      >
                        {isSubmitting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                        {isSubmitting ? "Sending message…" : "Send Message"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Response time indicator */}
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-surface/60 p-4">
                  <div className="size-9 shrink-0 rounded-full bg-success/15 flex items-center justify-center">
                    <CheckCircle2 className="size-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Average response time: <span className="text-accent">under 4 hours</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Our support team is available Monday – Friday, 9 AM – 5 PM EST
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── FAQ Section ── */}
            <section className="mt-24 animate-[fadeInUp_1s_ease_both]">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                  Frequently Asked Questions
                </h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Quick answers to common questions about reaching our team.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
                {FAQS.map(({ q, a }) => (
                  <div
                    key={q}
                    className="rounded-2xl border border-border bg-card/70 p-5 hover:border-accent/30 hover:shadow-md transition-all duration-300"
                  >
                    <h4 className="text-sm font-semibold text-foreground mb-2 leading-snug">{q}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-border mt-auto bg-surface/40">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} PassAssist. All rights reserved.
            </div>
            <nav className="flex items-center gap-5 text-xs">
              <Link
                to={"/privacy" as any}
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to={"/terms" as any}
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to={"/about" as any}
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                About
              </Link>
              <Link
                to={"/portfolio" as any}
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Creator
              </Link>
            </nav>
          </div>
        </div>
      </footer>

      {/* Entrance animation keyframes (injected once via style tag) */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SimpleMarkdown + parseInline (unchanged logic)                    */
/* ------------------------------------------------------------------ */
function SimpleMarkdown({ content }: { content: string }) {
  if (!content) return null;
  const normalizedContent = content
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\s+(#{1,3}\s)/g, '\n\n$1')
    .replace(/\s+(-\s(?:\*\*.*?\*\*|[A-Z]))/g, '\n$1');
  const blocks = normalizedContent.split(/\n\n+/);
  
  const emailIntegrationIdx = blocks.findIndex(b => b.trim().startsWith("### Email Integration"));
  const visibleBlocks = emailIntegrationIdx >= 0 ? blocks.slice(0, emailIntegrationIdx) : blocks;

  return (
    <div className="space-y-6">
      {visibleBlocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("# ")) {
          return (
            <h1
              key={idx}
              className="text-3xl md:text-4xl font-bold tracking-tight text-foreground border-b pb-3 mt-4 mb-6"
            >
              {parseInline(trimmed.substring(2))}
            </h1>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={idx}
              className="text-2xl font-bold tracking-tight text-foreground mt-8 mb-4 border-l-4 border-accent pl-4"
            >
              {parseInline(trimmed.substring(3))}
            </h2>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={idx} className="text-xl font-semibold text-foreground mt-6 mb-3">
              {parseInline(trimmed.substring(4))}
            </h3>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split(/\n[-*]\s+/);
          return (
            <ul
              key={idx}
              className="list-disc pl-6 space-y-2.5 my-4 text-foreground/80 text-base leading-relaxed"
            >
              {items.map((item, itemIdx) => {
                let cleanItem = item;
                if (itemIdx === 0) {
                  cleanItem = item.replace(/^[-*]\s+/, "");
                }
                return <li key={itemIdx}>{parseInline(cleanItem)}</li>;
              })}
            </ul>
          );
        }

        const lines = trimmed.split("\n");
        return (
          <p key={idx} className="text-foreground/80 text-base leading-relaxed my-4">
            {lines.map((line, lineIdx) => (
              <span key={lineIdx}>
                {lineIdx > 0 && <br />}
                {parseInline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function parseInline(text: string) {
  const inlineRegex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
  const tokens = text.split(inlineRegex);

  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("[") && token.includes("](")) {
      const match = token.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const [_, label, url] = match;
        if (url.startsWith("http")) {
          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              {label}
            </a>
          );
        } else {
          return (
            <Link key={index} to={url as any} className="text-accent hover:underline">
              {label}
            </Link>
          );
        }
      }
    }
    return token;
  });
}
