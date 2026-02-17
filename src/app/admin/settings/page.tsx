import { requireAdminSession, getSelectedSiteId } from "../../../lib/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { updateEmailSettingsAction } from "./actions";
import SendPendingEmailsButton from "../../../components/SendPendingEmailsButton";

type AdminSettingsPageProps = {
  searchParams?: {
    error?: string;
    success?: string;
  };
};

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  await requireAdminSession();
  const siteId = await getSelectedSiteId();

  if (!siteId) {
    return (
      <main className="page">
        <p>Select a site first.</p>
      </main>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: site, error } = await supabase
    .from("sites")
    .select("id, name, domain, email_enabled, email_from, email_sender_name")
    .eq("id", siteId)
    .maybeSingle();

  if (error || !site) {
    return (
      <main className="page">
        <p>Site not found.</p>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>Site settings</h1>
      <p>
        Configure email delivery for <strong>{site.name}</strong>.
      </p>
      {searchParams?.error ? (
        <p className="text-error">{searchParams.error}</p>
      ) : null}
      {searchParams?.success ? (
        <p className="text-success">{searchParams.success}</p>
      ) : null}
      <form action={updateEmailSettingsAction} className="form">
        <label className="form-field">
          <input
            type="checkbox"
            name="emailEnabled"
            defaultChecked={site.email_enabled}
          />{" "}
          Enable email notifications for this site
        </label>
        <label className="form-field">
          Email from address
          <input
            type="email"
            name="emailFrom"
            defaultValue={site.email_from ?? ""}
            placeholder="newsletter@your-domain.com"
          />
        </label>
        <label className="form-field">
          Sender name (optional)
          <input
            type="text"
            name="emailSenderName"
            defaultValue={site.email_sender_name ?? ""}
            placeholder={site.name}
          />
        </label>
        <button type="submit" className="button button-primary">
          Save settings
        </button>
      </form>
      <section className="section">
        <h2>Send pending emails</h2>
        <p className="text-secondary">
          Uses the Resend API key and sends queued notifications.
        </p>
        <SendPendingEmailsButton />
      </section>
    </main>
  );
}
