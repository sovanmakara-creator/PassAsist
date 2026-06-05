import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Sparkles,
  Camera,
  Loader2,
  Award,
  BookOpen,
  Mail,
  Target,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile Settings — PassAssist" },
      {
        name: "description",
        content: "Customize your PassAssist user profile, avatar, and study targets.",
      },
    ],
  }),
  component: ProfilePage,
});

const presets = [
  { name: "Scholar", gradient: "from-blue-500 to-indigo-500", icon: Award },
  { name: "Creator", gradient: "from-purple-500 to-pink-500", icon: Sparkles },
  { name: "Reader", gradient: "from-emerald-500 to-teal-500", icon: BookOpen },
  { name: "Challenger", gradient: "from-amber-500 to-orange-500", icon: Target },
];

function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [targetExam, setTargetExam] = useState("IELTS");
  const [targetScore, setTargetScore] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Initialize form fields from Supabase metadata
  useEffect(() => {
    if (user?.user_metadata) {
      setFullName(user.user_metadata.full_name || "");
      setTargetExam(user.user_metadata.target_exam || "IELTS");
      setTargetScore(user.user_metadata.target_score || "");
      setAvatarUrl(user.user_metadata.avatar_url || "");
    }
  }, [user]);

  const handlePresetSelect = (gradient: string) => {
    // Generate a canvas circle base64 image from the preset
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 128, 128);
      if (gradient.includes("blue")) {
        grad.addColorStop(0, "#3b82f6");
        grad.addColorStop(1, "#6366f1");
      } else if (gradient.includes("purple")) {
        grad.addColorStop(0, "#a855f7");
        grad.addColorStop(1, "#ec4899");
      } else if (gradient.includes("emerald")) {
        grad.addColorStop(0, "#10b981");
        grad.addColorStop(1, "#14b8a6");
      } else {
        grad.addColorStop(0, "#f59e0b");
        grad.addColorStop(1, "#f97316");
      }
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
      
      // Draw initials text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const initials = fullName 
        ? fullName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() 
        : user?.email?.substring(0, 2).toUpperCase() || "US";
      ctx.fillText(initials, 64, 64);
      
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setAvatarUrl(dataUrl);
      toast.success("Preset selected!");
      saveAvatar(dataUrl);
    }
  };

  const saveAvatar = async (newAvatarUrl: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_url: newAvatarUrl,
        },
      });
      if (error) throw error;
      toast.success("Profile picture saved successfully!");
      // Short delay to let the toast display, then reload to sync all layouts
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save profile picture.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file is too large. Please select a file under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const size = Math.min(img.width, img.height);
          ctx.drawImage(
            img,
            (img.width - size) / 2,
            (img.height - size) / 2,
            size,
            size,
            0,
            0,
            128,
            128
          );
          const resizedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setAvatarUrl(resizedBase64);
          toast.success("Custom profile picture uploaded!");
          saveAvatar(resizedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          target_exam: targetExam,
          target_score: targetScore,
          avatar_url: avatarUrl,
        },
      });

      if (error) throw error;
      toast.success("Profile saved successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update profile settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully!");
      window.location.href = "/";
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to sign out.");
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in md:px-6">
        <PageHeader
          eyebrow="Settings"
          title="Account Profile"
          description="Update your display name, profile avatar, and personalized English study targets."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avatar Settings Panel */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-md flex flex-col items-center justify-between text-center relative overflow-hidden min-h-[300px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-xl rounded-full" />
            
            <div className="w-full flex flex-col items-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-4">
                Avatar Preview
              </span>
              
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile Avatar"
                    className="size-24 rounded-full object-cover border-2 border-accent shadow-lg"
                  />
                ) : (
                  <div className="size-24 rounded-full bg-gradient-to-tr from-accent to-violet-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
                    {fullName ? fullName.substring(0, 2).toUpperCase() : user?.email?.substring(0, 2).toUpperCase() || "US"}
                  </div>
                )}
                <label
                  htmlFor="avatar-file"
                  className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                >
                  <Camera className="size-5 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                </label>
                <input
                  id="avatar-file"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="mt-4 w-full">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-2.5">
                  Select Preset Gradient
                </span>
                <div className="flex justify-center gap-2">
                  {presets.map((p, idx) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePresetSelect(p.gradient)}
                        className={`size-8 rounded-lg bg-gradient-to-tr ${p.gradient} text-white flex items-center justify-center shadow hover:scale-105 active:scale-95 transition-transform`}
                        title={p.name}
                      >
                        <Icon className="size-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 w-full text-left bg-muted/40 p-3.5 rounded-2xl border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Avatar Sync:</span> Your custom avatar and presets sync instantly with all navigation layouts.
            </div>
          </div>

          {/* Form Settings Panel */}
          <div className="md:col-span-2 rounded-3xl border border-border bg-card p-6 md:p-8 shadow-md">
            <form onSubmit={handleSave} className="space-y-5">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullname" className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/85">
                  Display Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-xl h-10.5 pl-10 bg-surface/50 border-border/80 focus-visible:ring-accent focus-visible:ring-offset-2 transition-all hover:border-accent/40"
                  />
                </div>
              </div>

              {/* Email Address (Disabled) */}
              <div className="space-y-1.5 opacity-70">
                <Label htmlFor="email" className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/85">
                  Email Address (Read-only)
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="rounded-xl h-10.5 pl-10 bg-muted/50 border-border/40 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Target Exam */}
                <div className="space-y-1.5">
                  <Label htmlFor="target-exam" className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/85">
                    Target Exam
                  </Label>
                  <select
                    id="target-exam"
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    className="w-full rounded-xl h-10.5 px-3 bg-surface/50 border border-border/80 focus-visible:ring-accent focus-visible:ring-offset-2 transition-all hover:border-accent/40 text-sm font-semibold"
                  >
                    <option value="IELTS">IELTS</option>
                    <option value="TOEFL">TOEFL</option>
                    <option value="TOEIC">TOEIC</option>
                  </select>
                </div>

                {/* Target Score */}
                <div className="space-y-1.5">
                  <Label htmlFor="target-score" className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/85">
                    Target Score Goal
                  </Label>
                  <Input
                    id="target-score"
                    type="text"
                    placeholder="e.g. Band 8.0, 105 pts"
                    value={targetScore}
                    onChange={(e) => setTargetScore(e.target.value)}
                    className="rounded-xl h-10.5 bg-surface/50 border-border/80 focus-visible:ring-accent focus-visible:ring-offset-2 transition-all hover:border-accent/40"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-6 rounded-xl h-10.5 font-bold shadow-md shadow-accent/15 cursor-pointer bg-accent hover:bg-accent/90 text-white hover:scale-[1.01] transition-all flex-1 sm:flex-none"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <>Save Profile Changes</>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSignOut}
                  className="px-6 rounded-xl h-10.5 font-bold cursor-pointer border-destructive/30 hover:border-destructive hover:bg-destructive/10 text-destructive hover:scale-[1.01] transition-all flex-1 sm:flex-none flex items-center justify-center"
                >
                  <LogOut className="size-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
