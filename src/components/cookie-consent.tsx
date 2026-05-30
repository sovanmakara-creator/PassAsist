import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, Shield, ChevronDown, ChevronUp, X, Check } from "lucide-react";

const COOKIE_CONSENT_KEY = "prepai_cookie_consent";
const COOKIE_PREFS_KEY = "prepai_cookie_prefs";

interface CookiePrefs {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

const DEFAULT_PREFS: CookiePrefs = {
  necessary: true,
  analytics: false,
  marketing: false,
  personalization: false,
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>(DEFAULT_PREFS);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing banner for a smoother experience
      const timer = setTimeout(() => {
        setVisible(true);
        requestAnimationFrame(() => setAnimateIn(true));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePrefs = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(allAccepted));
    animateOut();
  };

  const handleRejectAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(DEFAULT_PREFS));
    animateOut();
  };

  const handleSavePreferences = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "custom");
    localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(prefs));
    animateOut();
  };

  const animateOut = () => {
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 400);
  };

  const togglePref = (key: keyof CookiePrefs) => {
    if (key === "necessary") return;
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  if (!visible) return null;

  const categories = [
    {
      key: "necessary" as keyof CookiePrefs,
      label: "Essential Cookies",
      desc: "Required for the website to function properly. Cannot be disabled.",
      locked: true,
    },
    {
      key: "analytics" as keyof CookiePrefs,
      label: "Analytics Cookies",
      desc: "Help us understand how visitors interact with our website by collecting and reporting information anonymously.",
      locked: false,
    },
    {
      key: "marketing" as keyof CookiePrefs,
      label: "Marketing Cookies",
      desc: "Used to track visitors across websites to display relevant ads. Includes Google AdSense and DoubleClick DART cookies.",
      locked: false,
    },
    {
      key: "personalization" as keyof CookiePrefs,
      label: "Personalization Cookies",
      desc: "Allow the website to remember choices you make and provide enhanced, personalized features.",
      locked: false,
    },
  ];

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[9999] flex justify-center px-4 pb-4 sm:px-6 sm:pb-6 transition-all duration-500 ease-out ${
        animateIn ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
      role="dialog"
      aria-label="Cookie consent"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border/60 shadow-2xl overflow-hidden"
        style={{
          background: "var(--card)",
          backdropFilter: "blur(20px) saturate(1.5)",
          WebkitBackdropFilter: "blur(20px) saturate(1.5)",
        }}
      >
        {/* Gradient top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-accent via-accent/60 to-accent/20" />

        <div className="px-5 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 size-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Cookie className="size-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                We value your privacy
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                We use cookies to enhance your browsing experience, serve personalized ads, and
                analyze our traffic. Read our{" "}
                <Link to="/privacy" className="text-accent hover:underline font-medium">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Expandable details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 group"
          >
            <Shield className="size-3.5 text-accent/70 group-hover:text-accent transition-colors" />
            Manage cookie preferences
            {showDetails ? (
              <ChevronUp className="size-3 ml-0.5" />
            ) : (
              <ChevronDown className="size-3 ml-0.5" />
            )}
          </button>

          {showDetails && (
            <div className="space-y-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  className="flex items-start gap-3 rounded-xl border border-border/50 bg-surface/50 px-3.5 py-2.5"
                >
                  <button
                    onClick={() => togglePref(cat.key)}
                    disabled={cat.locked}
                    className={`mt-0.5 flex-shrink-0 size-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                      prefs[cat.key]
                        ? "bg-accent border-accent text-accent-foreground"
                        : "border-border hover:border-accent/50"
                    } ${cat.locked ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                    aria-label={`Toggle ${cat.label}`}
                  >
                    {prefs[cat.key] && <Check className="size-3" strokeWidth={3} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground">{cat.label}</div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                      {cat.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {showDetails ? (
              <>
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground px-4 py-2.5 text-xs font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.98] shadow-md shadow-accent/20"
                >
                  <Check className="size-3.5" />
                  Save Preferences
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-foreground transition-all duration-200 hover:bg-surface-elevated active:scale-[0.98]"
                >
                  Accept All
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground px-4 py-2.5 text-xs font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.98] shadow-md shadow-accent/20"
                >
                  <Check className="size-3.5" />
                  Accept All Cookies
                </button>
                <button
                  onClick={handleRejectAll}
                  className="flex-1 inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-foreground transition-all duration-200 hover:bg-surface-elevated active:scale-[0.98]"
                >
                  Reject Non-Essential
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
