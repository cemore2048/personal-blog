"use client";

import { useState } from "react";
import Link from "next/link";

import { createBrowserSupabaseClient } from "../../../lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/admin/reset-password`,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <main className="page page--narrow">
        <h1>Check your email</h1>
        <p className="text-secondary">
          If an account exists for <strong>{email}</strong>, we sent a reset
          link. Open it to choose a new password.
        </p>
        <p>
          <Link href="/admin/login">Back to login</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="page page--narrow">
      <h1>Reset password</h1>
      <p className="text-secondary">
        Enter the email for your admin account. We will send a reset link.
      </p>
      <form onSubmit={handleSubmit} className="form">
        <label className="form-field">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
          {isLoading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p>
        <Link href="/admin/login">Back to login</Link>
      </p>
    </main>
  );
}
