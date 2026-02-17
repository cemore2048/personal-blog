import { requireAdminSession, getSelectedSiteId } from "../../../lib/admin";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

type DayCount = {
  date: string;
  count: number;
  previews: number;
};

function buildDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildRecentDays(days: number) {
  const now = new Date();
  const list: string[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const next = new Date(now);
    next.setUTCDate(now.getUTCDate() - i);
    next.setUTCHours(0, 0, 0, 0);
    list.push(buildDateKey(next));
  }

  return list;
}

export default async function AdminAnalyticsPage() {
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
  const since30 = new Date();
  since30.setUTCDate(since30.getUTCDate() - 30);

  const { data: impressions } = await supabase
    .from("impressions")
    .select("post_id, created_at, is_preview")
    .eq("site_id", siteId)
    .gte("created_at", since30.toISOString());

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title")
    .eq("site_id", siteId);

  const postTitleById = new Map(
    (posts ?? []).map((post) => [post.id, post.title])
  );

  const totalsByPost = new Map<string, { total: number; previews: number }>();
  const byDay = new Map<string, DayCount>();

  for (const day of buildRecentDays(30)) {
    byDay.set(day, { date: day, count: 0, previews: 0 });
  }

  for (const impression of impressions ?? []) {
    const day = buildDateKey(new Date(impression.created_at));
    const bucket = byDay.get(day);
    if (bucket) {
      bucket.count += 1;
      if (impression.is_preview) {
        bucket.previews += 1;
      }
    }

    if (impression.post_id) {
      const existing = totalsByPost.get(impression.post_id) ?? {
        total: 0,
        previews: 0,
      };
      existing.total += 1;
      if (impression.is_preview) {
        existing.previews += 1;
      }
      totalsByPost.set(impression.post_id, existing);
    }
  }

  const last7Days = buildRecentDays(7).map((day) => byDay.get(day)!);
  const last30Days = buildRecentDays(30).map((day) => byDay.get(day)!);

  const total7 = last7Days.reduce((sum, day) => sum + day.count, 0);
  const total30 = last30Days.reduce((sum, day) => sum + day.count, 0);

  const perPostRows = Array.from(totalsByPost.entries())
    .map(([postId, counts]) => ({
      postId,
      title: postTitleById.get(postId) ?? "Untitled",
      total: counts.total,
      previews: counts.previews,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <main className="page page--xwide">
      <h1>Analytics</h1>
      <p className="text-secondary">
        Impressions include previews and exclude bots.
      </p>

      <section className="section">
        <h2>Totals</h2>
        <p>
          Last 7 days: <strong>{total7}</strong>
        </p>
        <p>
          Last 30 days: <strong>{total30}</strong>
        </p>
      </section>

      <section className="section">
        <h2>Last 7 days trend</h2>
        <ul className="list-reset">
          {last7Days.map((day) => (
            <li key={day.date} className="meta">
              {day.date}: {day.count} views ({day.previews} previews)
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <h2>Last 30 days trend</h2>
        <ul className="list-reset">
          {last30Days.map((day) => (
            <li key={day.date} className="meta">
              {day.date}: {day.count} views ({day.previews} previews)
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <h2>Per-post totals</h2>
        {!perPostRows.length ? <p>No impressions yet.</p> : null}
        <ul className="list-reset">
          {perPostRows.map((row) => (
            <li key={row.postId} className="card card--spaced">
              <p className="no-margin">
                <strong>{row.title}</strong>
              </p>
              <p className="meta">
                Total: {row.total} (Previews: {row.previews})
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
