import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  // 1. Track authentication session state
  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!active) return;
      setSession(s);
      setUser(s?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch role when user ID changes
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsAdmin(false);
      setRoleLoading(false);
      return;
    }

    let active = true;
    setRoleLoading(true);

    const userId = user.id;
    const userEmail = user.email;

    async function fetchRole() {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("id", userId)
          .single();

        console.log("[useAuth Debug] user:", userEmail, "role:", data?.role, "error:", error);

        if (active) {
          setIsAdmin(!error && data?.role === "admin");
          setRoleLoading(false);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        if (active) {
          setIsAdmin(false);
          setRoleLoading(false);
        }
      }
    }

    fetchRole();

    return () => {
      active = false;
    };
  }, [user?.id, authLoading]);

  // Combined loading state: true if auth session is loading OR if user is signed in and role is loading
  const loading = authLoading || (user !== null && roleLoading);

  return { session, user, isAdmin, loading };
}
