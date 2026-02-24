import type { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  authError: string;
  signIn: (credentials: { email: string; password: string }) => Promise<{ error: string | null }>;
  signUp: (credentials: { email: string; password: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function extractMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) setAuthError(extractMessage(error, "Unable to restore session."));
        setSession(data?.session ?? null);
        setUser(data?.session?.user ?? null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setAuthError("");
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function signIn({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<{ error: string | null }> {
    if (!supabase) return { error: "Supabase is not configured." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const message = extractMessage(error, "Sign in failed.");
      setAuthError(message);
      return { error: message };
    }
    return { error: null };
  }

  async function signUp({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<{ error: string | null }> {
    if (!supabase) return { error: "Supabase is not configured." };
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const message = extractMessage(error, "Sign up failed.");
      setAuthError(message);
      return { error: message };
    }
    return { error: null };
  }

  async function signOut(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      authError,
      signIn,
      signUp,
      signOut,
      isConfigured: isSupabaseConfigured,
    }),
    [session, user, loading, authError], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
