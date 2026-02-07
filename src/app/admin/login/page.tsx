"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`
      }
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Magic link sent. Check your inbox.");
    }

    setIsSubmitting(false);
  };

  return (
    <section className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Admin login</h1>
        <p className="text-sm text-slate-600">
          Sign in with your email to access drafts and metrics.
        </p>
        <p className="text-xs text-slate-500">
          Admin access is limited to rmoreno.cesar@gmail.com.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-800">Email</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <button
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send magic link"}
        </button>
      </form>
      {message ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}
    </section>
  );
}
