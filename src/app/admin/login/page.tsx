"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "../../../lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    router.replace("/admin/sites");
  };

  return (
    <main className="page page--narrow">
      <h1>Admin Login</h1>
      <p className="text-secondary">Use your Supabase Auth credentials.</p>
      <form onSubmit={handleSubmit} className="form">
        <label className="form-field">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="form-field">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
