import React, { useState } from "react";

import { useAuth } from "../../context/AuthContext";

export default function AuthPanel() {
  const { signIn, signUp, authError, isConfigured } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  if (!isConfigured) {
    return (
      <main className="page">
        <section className="card section auth-card">
          <h1>Supabase Not Configured</h1>
          <p className="muted">
            Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your
            environment.
          </p>
        </section>
      </main>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const action = mode === "signin" ? signIn : signUp;
    const result = await action({ email: email.trim(), password });

    if (result.error) {
      setMessage(result.error);
    } else if (mode === "signup") {
      setMessage(
        "Account created. If email verification is enabled, confirm your email and sign in.",
      );
    }

    setSubmitting(false);
  }

  return (
    <main className="page">
      <section className="card section auth-card">
        <h1>{mode === "signin" ? "Sign In" : "Create Account"}</h1>
        <p className="muted">Use your email to access the wedding workspace.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        {(message || authError) && <p className="muted">{message || authError}</p>}

        <button
          className="btn secondary"
          type="button"
          onClick={() => setMode((prev) => (prev === "signin" ? "signup" : "signin"))}
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
