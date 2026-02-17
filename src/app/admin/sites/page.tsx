import { requireAdminSession } from "../../../lib/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { selectSiteAction } from "./actions";

export default async function AdminSiteSelectPage() {
  await requireAdminSession();
  const supabase = await createServerSupabaseClient();
  const { data: sites, error } = await supabase
    .from("sites")
    .select("id, name, domain")
    .order("name");

  return (
    <main className="page">
      <h1>Select a site</h1>
      <p className="text-secondary">This choice scopes all admin actions.</p>
      {error ? (
        <p className="text-error">{error.message}</p>
      ) : null}
      <ul className="list-reset section">
        {(sites ?? []).map((site) => (
          <li key={site.id} className="card card--spaced">
            <p className="no-margin">
              <strong>{site.name}</strong>
            </p>
            <p className="text-secondary">{site.domain}</p>
            <form action={selectSiteAction}>
              <input type="hidden" name="siteId" value={site.id} />
              <button type="submit" className="button button-primary">
                Use this site
              </button>
            </form>
          </li>
        ))}
      </ul>
      {!sites?.length && !error ? (
        <p>No sites found. Add one in Supabase.</p>
      ) : null}
    </main>
  );
}
