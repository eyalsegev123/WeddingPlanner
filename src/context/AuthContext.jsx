import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

function makeError(error, fallback) {
  return error?.message || fallback;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return undefined;
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) {
          return;
        }
        if (error) {
          setAuthError(makeError(error, "Unable to restore session."));
        }
        setSession(data?.session || null);
        setUser(data?.session?.user || null);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setUser(nextSession?.user || null);
      setAuthError("");
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function signIn({ email, password }) {
    if (!supabase) {
      return { error: "Supabase is not configured." };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const message = makeError(error, "Sign in failed.");
      setAuthError(message);
      return { error: message };
    }
    return { error: null };
  }

  async function signUp({ email, password }) {
    if (!supabase) {
      return { error: "Supabase is not configured." };
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const message = makeError(error, "Sign up failed.");
      setAuthError(message);
      return { error: message };
    }
    return { error: null };
  }

  async function signOut() {
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
  }

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      authError,
      signIn,
      signUp,
      signOut,
      isConfigured: isSupabaseConfigured
    }),
    [session, user, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
