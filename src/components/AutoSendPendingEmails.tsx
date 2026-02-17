"use client";

import { useEffect, useState } from "react";

type AutoSendPendingEmailsProps = {
  shouldSend: boolean;
};

export default function AutoSendPendingEmails({
  shouldSend,
}: AutoSendPendingEmailsProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!shouldSend) {
      return;
    }

    let isActive = true;

    const run = async () => {
      try {
        const response = await fetch("/api/email/send", { method: "POST" });
        const result = await response.json();

        if (!isActive) {
          return;
        }

        if (!response.ok) {
          setMessage(result.error ?? "Failed to send emails.");
        } else {
          setMessage(
            `Processed ${result.processed}. Sent ${result.sent}. Failed ${result.failed}.`
          );
        }
      } catch (error) {
        if (isActive) {
          setMessage(
            error instanceof Error ? error.message : "Failed to send emails."
          );
        }
      }
    };

    run();

    return () => {
      isActive = false;
    };
  }, [shouldSend]);

  if (!shouldSend) {
    return null;
  }

  return message ? <p className="text-secondary section">{message}</p> : null;
}
