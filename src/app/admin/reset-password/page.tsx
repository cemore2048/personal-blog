"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "../../../lib/supabase/client";
import {
  PASSWORD_MIN_LENGTH,
  getPasswordPolicyErrors,
} from "../../../lib/password-policy";

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

function queryLooksLikeRecovery() {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
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

    if (hashLooksLikeRecovery() || queryLooksLikeRecovery()) {
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

    const policyErrors = getPasswordPolicyErrors(password);
    if (policyErrors.length > 0) {
      setErrorMessage(policyErrors.join(" "));
      return;
    }

    if (!recoveryReady) {
      setErrorMessage(
        "Reset session not found. Open this page from the link in your reset email, or request a new link."
      );
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

  const policyErrors = getPasswordPolicyErrors(password);
  const showPolicyHints = password.length > 0 && policyErrors.length > 0;

  return (
    <main className="page page--narrow">
      <h1>Set new password</h1>
      {!recoveryReady ? (
        <p className="text-secondary">
          Open this page from the link in your reset email. If the form stays
          locked, use &quot;Request new link&quot; below, then try again.
        </p>
      ) : (
        <p className="text-secondary">
          Choose a strong password. You will use it to sign in next time.
        </p>
      )}

      <ul
        id="password-requirements"
        className="reset-password-requirements text-secondary"
      >
        <li>At least {PASSWORD_MIN_LENGTH} characters</li>
        <li>Uppercase and lowercase letters</li>
        <li>At least one number</li>
        <li>At least one symbol (e.g. !@#$%)</li>
      </ul>

      <form onSubmit={handleSubmit} className="form">
        <label className="form-field">
          New password
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby="password-requirements"
          />
        </label>
        <label className="form-field">
          Confirm password
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        {showPolicyHints ? (
          <ul className="text-error reset-password-missing">
            {policyErrors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        ) : null}
        {errorMessage ? (
          <p className="text-error">{errorMessage}</p>
        ) : null}
        <button
          type="submit"
          disabled={isLoading || !recoveryReady}
          className="button button-primary"
        >
          {isLoading
            ? "Saving…"
            : !recoveryReady
              ? "Waiting for reset link…"
              : "Update password"}
        </button>
      </form>
      <p>
        <Link href="/admin/forgot-password">Request new link</Link>
        {" · "}
        <Link href="/admin/login">Back to login</Link>
      </p>
    </main>
  );
}
