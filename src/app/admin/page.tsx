import { redirect } from "next/navigation";

import { getSelectedSiteId, requireAdminSession } from "../../lib/admin";

export default async function AdminHomePage() {
  await requireAdminSession();
  const selectedSiteId = await getSelectedSiteId();

  if (!selectedSiteId) {
    redirect("/admin/sites");
  }

  redirect("/admin/posts");
}
