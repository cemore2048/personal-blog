import { requireAdminSession, getSelectedSiteId } from "../../../lib/admin";

export default async function AdminExportsPage() {
  await requireAdminSession();
  const siteId = await getSelectedSiteId();

  if (!siteId) {
    return (
      <main className="page">
        <p>Select a site first.</p>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>Exports</h1>
      <p className="text-secondary">
        Download Markdown and CSV exports for the current site.
      </p>
      <section className="section">
        <h2>Posts (Markdown)</h2>
        <p>Single file export with frontmatter per post.</p>
        <a href="/api/exports/posts">Download Markdown export</a>
      </section>
      <section className="section">
        <h2>Subscribers (CSV)</h2>
        <p>Includes active and unsubscribed addresses.</p>
        <a href="/api/exports/subscribers">Download CSV export</a>
      </section>
    </main>
  );
}
