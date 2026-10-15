import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";

export function AuthPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setStatus("Supabase is not configured for this deployment.");
      return;
    }

    setIsSubmitting(true);
    setStatus("");
    const result = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName.trim() || "Ready when you are" } },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);
    if (result.error) {
      setStatus(result.error.message);
      return;
    }

    if (isSignUp && !result.data.session) {
      setStatus("Check your inbox to confirm your email, then come back to sign in.");
      return;
    }

    if (!isSignUp && result.data.user) {
      const { error: welcomeError } = await supabase.functions.invoke("welcome-login", {
        body: {
          email: result.data.user.email,
          displayName: result.data.user.user_metadata?.display_name,
        },
      });

      if (welcomeError) {
        setStatus("Signed in. We could not send the welcome email this time.");
        window.setTimeout(() => navigate("/onboarding", { replace: true }), 1200);
        return;
      }
    }

    navigate("/onboarding", { replace: true });
  }

  return (
    <main className="auth-shell">
      <div className="auth-orb auth-orb-orange" aria-hidden="true" />
      <div className="auth-orb auth-orb-violet" aria-hidden="true" />
      <header className="auth-header">
        <span className="auth-mark" aria-hidden="true">✦</span>
        <span className="auth-brand">Contingency Genius</span>
      </header>
      <section className="auth-content">
        <p className="eyebrow">A CALMER WAY TO PREPARE</p>
        <h1>{isSignUp ? "Build your safety net." : "Welcome back, stay ready."}</h1>
        <p className="auth-copy">
          Your day changes. Your backup plan changes with it.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <label>
              <span>Name</span>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" required />
            </label>
          )}
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isSignUp ? "new-password" : "current-password"} minLength={6} required />
          </label>
          <button className="button auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Opening your workspace…" : isSignUp ? "Create my account" : "Enter my workspace"}
            <span aria-hidden="true">↗</span>
          </button>
          {status && <p className="auth-status" role="status">{status}</p>}
        </form>
        <button className="auth-switch" type="button" onClick={() => setIsSignUp((value) => !value)}>
          {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </section>
      <footer className="auth-footer">
        <span>Private by design</span>
        <span>•</span>
        <span>Your readiness, your rules</span>
      </footer>
    </main>
  );
}
