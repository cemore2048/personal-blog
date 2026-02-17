"use client";

import { useState } from "react";

type PublishSettingsDrawerProps = {
  postId: string;
  status: string;
  publishedAt?: string | null;
  notifyOnPublish?: boolean | null;
  emailEnabled?: boolean | null;
  shouldSendEmails: boolean;
  action: (formData: FormData) => void;
  children?: React.ReactNode;
};

export default function PublishSettingsDrawer({
  postId,
  status,
  publishedAt,
  notifyOnPublish,
  emailEnabled,
  shouldSendEmails,
  action,
  children,
}: PublishSettingsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open publish settings"
        className="button button-primary drawer-toggle"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a7.94 7.94 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8.3 8.3 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a8.3 8.3 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.94 7.94 0 0 0 .1 2l-2 1.5 2 3.5 2.4-1a8.3 8.3 0 0 0 1.7 1l.3 2.6h4l.3-2.6a8.3 8.3 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5z" />
        </svg>
      </button>

      {isOpen ? (
        <div
          role="presentation"
          onClick={() => setIsOpen(false)}
          className="drawer-backdrop"
        />
      ) : null}

      <aside
        aria-hidden={!isOpen}
        className={`drawer ${isOpen ? "drawer--open" : ""}`}
      >
        <div className="drawer-header">
          <h2 className="card-title">Publish settings</h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close publish settings"
            className="button"
          >
            Close
          </button>
        </div>

        <p className="text-secondary">
          Current status: <strong>{status}</strong>
        </p>
        {typeof emailEnabled === "boolean" ? (
          <p className="text-secondary">
            Email enabled: <strong>{emailEnabled ? "Yes" : "No"}</strong>
          </p>
        ) : null}
        {publishedAt ? (
          <p className="text-secondary">
            Publish at: {new Date(publishedAt).toLocaleString()}
          </p>
        ) : null}

        <form action={action} className="form">
          <input type="hidden" name="postId" value={postId} />
          <label className="form-field">
            Publish mode
            <select
              name="mode"
              defaultValue="quiet"
            >
              <option value="quiet">Publish quietly</option>
              <option value="notify">Publish and notify</option>
              <option value="scheduled">Schedule publish</option>
            </select>
          </label>
          <label className="form-field">
            Schedule time (required for scheduled)
            <input
              type="datetime-local"
              name="scheduleAt"
            />
          </label>
          <label className="form-field">
            <input
              type="checkbox"
              name="notify"
              defaultChecked={Boolean(notifyOnPublish)}
            />{" "}
            Send email when published
          </label>
          <button type="submit" className="button button-primary">
            Apply publish setting
          </button>
        </form>
        {children ? <div className="section">{children}</div> : null}
      </aside>
    </>
  );
}
