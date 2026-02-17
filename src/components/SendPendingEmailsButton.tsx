"use client";

import { useState } from "react";

export default function SendPendingEmailsButton() {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    setIsSending(true);
    setMessage("");

    try {
      const response = await fetch("/api/email/send", { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Failed to send emails.");
      } else {
        setMessage(
          `Processed ${result.processed}. Sent ${result.sent}. Failed ${result.failed}.`
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send emails.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="section">
      <button
        type="button"
        onClick={handleSend}
        disabled={isSending}
        className="button button-primary"
      >
        {isSending ? "Sending..." : "Send pending emails"}
      </button>
      {message ? <p className="text-secondary section">{message}</p> : null}
    </div>
  );
}
