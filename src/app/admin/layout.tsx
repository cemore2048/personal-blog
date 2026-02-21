import { headers } from "next/headers";

import { getSelectedSiteId } from "../../lib/admin";
import { createServerSupabaseClient } from "../../lib/supabase/server";
import AdminLayoutShell from "../../components/AdminLayoutShell";

async function getLayoutData() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const isAdmin = host.startsWith("admin.");
  const domain = isAdmin ? host.slice("admin.".length) : host;
  const isLocalhost =
    domain === "localhost" ||
    domain.startsWith("localhost:") ||
    domain === "127.0.0.1";
  const protocol = isLocalhost ? "http" : "https";
  const publicUrl = `${protocol}://${domain}`;

  const siteId = await getSelectedSiteId();
  let siteName = "Admin";

  if (siteId) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("sites")
      .select("name")
      .eq("id", siteId)
      .maybeSingle();
    if (data) {
      siteName = data.name;
    }
  }

  return { siteName, publicUrl };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { siteName, publicUrl } = await getLayoutData();

  return (
    <AdminLayoutShell siteName={siteName} publicUrl={publicUrl}>
      {children}
    </AdminLayoutShell>
  );
}
