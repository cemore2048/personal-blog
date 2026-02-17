import { redirect } from "next/navigation";

import { getSelectedSiteId, requireAdminSession } from "../../lib/admin";
import { createServerSupabaseClient } from "../../lib/supabase/server";

export default async function AdminHomePage() {
  await requireAdminSession();
  const selectedSiteId = await getSelectedSiteId();

  if (!selectedSiteId) {
    redirect("/admin/sites");
  }

  const supabase = await createServerSupabaseClient();
  const { data: site, error } = await supabase
    .from("sites")
    .select("id, name, domain")
    .eq("id", selectedSiteId)
    .maybeSingle();

  return (
    <main className="page">
      <h1>Admin Dashboard</h1>
      <p className="text-secondary">Milestone 2: authenticated admin scope.</p>
      <section className="card section">
        <h2 className="card-title">Site context</h2>
        {site ? (
          <>
            <p>
              <strong>site:</strong> {site.name}
            </p>
            <p>
              <strong>domain:</strong> {site.domain}
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>site:</strong> not found
            </p>
            <p>
              <strong>site id:</strong> {selectedSiteId}
            </p>
          </>
        )}
        {error ? <p className="text-error">{error.message}</p> : null}
      </section>
      <section className="section">
        <h2>Drafts</h2>
        <p>
          <a href="/admin/posts">Manage drafts</a>
        </p>
      </section>
      <section className="section">
        <h2>Settings</h2>
        <p>
          <a href="/admin/settings">Email settings</a>
        </p>
      </section>
      <section className="section">
        <h2>Analytics</h2>
        <p>
          <a href="/admin/analytics">View impressions</a>
        </p>
      </section>
      <section className="section">
        <h2>Exports</h2>
        <p>
          <a href="/admin/exports">Download data</a>
        </p>
      </section>
    </main>
  );
}
