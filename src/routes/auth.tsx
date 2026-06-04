import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { confirmUserOnServer } from "@/services/auth-admin.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — PassAssist" },
      {
        name: "description",
        content:
          "Sign in or create your PassAssist account to start AI-powered IELTS, TOEFL and TOEIC prep.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordSignUp, setShowPasswordSignUp] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let { data, error } = await supabase.auth.signInWithPassword({ 
      email: signInEmail, 
      password: signInPassword 
    });
    
    // Auto-confirm unconfirmed emails on the fly during login attempts
    if (error && error.message.toLowerCase().includes("confirm")) {
      try {
        const confirmRes = await confirmUserOnServer({ data: { email: signInEmail } });
        if (confirmRes?.success) {
          const retry = await supabase.auth.signInWithPassword({
            email: signInEmail,
            password: signInPassword,
          });
          error = retry.error;
        }
      } catch (confirmErr) {
        console.error("Auto-confirm failed during sign-in:", confirmErr);
      }
    }

    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    // Auto-confirm the newly registered user on the server
    try {
      await confirmUserOnServer({ data: { email: signUpEmail } });
      const loginAttempt = await supabase.auth.signInWithPassword({
        email: signUpEmail,
        password: signUpPassword,
      });
      setLoading(false);
      if (loginAttempt.error) {
        toast.success("Account created! Please sign in.");
      } else {
        toast.success("Account created and logged in successfully!");
        navigate({ to: "/dashboard" });
      }
    } catch (confirmErr) {
      setLoading(false);
      toast.success("Account registered. Check your email to confirm.");
    }
  };

  const signInWithProvider = async (provider: "google" | "facebook" | "apple") => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || `Failed to authenticate with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh animate-mesh flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated background bubbles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/8 blur-[120px] rounded-full animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-violet-500/8 blur-[120px] rounded-full animate-float stagger-4 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-8 group">
          <div className="size-9 rounded-xl bg-gradient-to-tr from-accent to-violet-500 flex items-center justify-center text-white shadow-lg shadow-accent/20 group-hover:scale-105 transition-transform duration-300">
            <Sparkles className="size-4 animate-pulse" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Pass<span className="text-accent bg-none">Assist</span>
          </span>
        </Link>

        {/* Card Container with enhanced glassmorphism */}
        <div className="rounded-3xl border border-border/80 bg-card/65 backdrop-blur-2xl p-8 shadow-2xl hover-glow transition-all duration-300">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight font-heading text-foreground">Welcome Back</h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Your AI-powered assistant for IELTS, TOEFL, and TOEIC success.
            </p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6 bg-muted/40 p-1 rounded-xl">
              <TabsTrigger
                value="signin"
                className="rounded-lg text-xs font-bold transition-all duration-200"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-lg text-xs font-bold transition-all duration-200"
              >
                Create Account
              </TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin" className="outline-none animate-fade-in">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/85">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="rounded-xl h-10.5 pl-10 bg-surface/50 border-border/80 focus-visible:ring-accent focus-visible:ring-offset-2 transition-all hover:border-accent/40"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/85">
                      Password
                    </Label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="rounded-xl h-10.5 pl-10 bg-surface/50 border-border/80 focus-visible:ring-accent focus-visible:ring-offset-2 transition-all hover:border-accent/40 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none flex items-center justify-center size-5"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full rounded-xl h-10.5 font-bold shadow-md shadow-accent/15 cursor-pointer bg-accent hover:bg-accent/90 text-white mt-2 hover:scale-[1.01] transition-transform"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <>
                      Sign in to dashboard <ArrowRight className="size-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Create Account Tab */}
            <TabsContent value="signup" className="outline-none animate-fade-in">
              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email2" className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/85">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                    <Input
                      id="email2"
                      type="email"
                      placeholder="name@example.com"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="rounded-xl h-10.5 pl-10 bg-surface/50 border-border/80 focus-visible:ring-accent focus-visible:ring-offset-2 transition-all hover:border-accent/40"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="password2" className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/85">
                    Choose password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                    <Input
                      id="password2"
                      type={showPasswordSignUp ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="rounded-xl h-10.5 pl-10 bg-surface/50 border-border/80 focus-visible:ring-accent focus-visible:ring-offset-2 transition-all hover:border-accent/40 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordSignUp(!showPasswordSignUp)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none flex items-center justify-center size-5"
                      title={showPasswordSignUp ? "Hide password" : "Show password"}
                    >
                      {showPasswordSignUp ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full rounded-xl h-10.5 font-bold shadow-md shadow-accent/15 cursor-pointer bg-accent hover:bg-accent/90 text-white mt-2 hover:scale-[1.01] transition-transform"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <>
                      Register account <ArrowRight className="size-4 ml-1.5" />
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-muted-foreground/80 mt-3 text-center leading-relaxed">
                  Note: Supabase requires a valid email format (e.g. Gmail). If email confirmation is enabled on your Supabase project, you must confirm your email before signing in, or disable it under <span className="font-semibold">Authentication &gt; Providers</span>.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          {/* Social Sign In Divider */}
          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-border/80" />
            <span className="flex-shrink mx-3 text-[10px] uppercase font-extrabold tracking-widest text-muted-foreground/60">
              Or continue with
            </span>
            <div className="flex-grow border-t border-border/80" />
          </div>

          {/* Social Login Buttons with Premium Scale Hover */}
          <div className="flex flex-col gap-2.5">
            {/* Google */}
            <Button
              variant="outline"
              onClick={() => signInWithProvider("google")}
              disabled={loading}
              className="w-full h-10.5 rounded-xl justify-center font-bold border-border/70 hover:bg-muted/40 hover:border-border hover-lift active:scale-95 duration-200 transition-all cursor-pointer"
            >
              <svg className="size-4.5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google Account
            </Button>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Facebook */}
              <Button
                variant="outline"
                onClick={() => signInWithProvider("facebook")}
                disabled={loading}
                className="h-10.5 rounded-xl justify-center font-bold border-border/70 hover:bg-muted/40 hover:border-border hover-lift active:scale-95 duration-200 transition-all cursor-pointer"
              >
                <svg className="size-4.5 mr-2 fill-[#1877F2]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>

              {/* Apple */}
              <Button
                variant="outline"
                onClick={() => signInWithProvider("apple")}
                disabled={loading}
                className="h-10.5 rounded-xl justify-center font-bold border-border/70 hover:bg-muted/40 hover:border-border hover-lift active:scale-95 duration-200 transition-all cursor-pointer"
              >
                <svg className="size-4.5 mr-2 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.83-.98 2.94.1.07.21.08.31.08.88 0 1.95-.54 2.5-1.41z" />
                </svg>
                Apple ID
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
