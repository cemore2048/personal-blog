"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "../../../lib/supabase/client";

function hashLooksLikeRecovery() {
  if (typeof window === "undefined") {
    return false;
  }
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) {
    return false;
  }
  const params = new URLSearchParams(raw);
  return params.get("type") === "recovery";
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    if (hashLooksLikeRecovery()) {
      setRecoveryReady(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryReady(true);
      }
    });

    void supabase.auth.getSession();

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Use at least 6 characters.");
      return;
    }

    setIsLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/admin/sites");
  };

  if (!recoveryReady) {
    return (
      <main className="page page--narrow">
        <h1>Set new password</h1>
        <p className="text-secondary">
          Open this page using the link in your reset email. If you landed here
          without that link, request a new one.
        </p>
        <p>
          <Link href="/admin/forgot-password">Send reset link</Link>
          {" · "}
          <Link href="/admin/login">Back to login</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="page page--narrow">
      <h1>Choose a new password</h1>
      <p className="text-secondary">Sign in next time with this password.</p>
      <form onSubmit={handleSubmit} className="form">
        <label className="form-field">
          New password
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="form-field">
          Confirm password
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        {errorMessage ? (
          <p className="text-error">{errorMessage}</p>
        ) : null}
        <button
          type="submit"
          disabled={isLoading}
          className="button button-primary"
        >
          {isLoading ? "Saving…" : "Update password"}
        </button>
      </form>
      <p>
        <Link href="/admin/login">Back to login</Link>
      </p>
    </main>
  );
}
