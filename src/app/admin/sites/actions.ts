"use server";

import { redirect } from "next/navigation";

import { requireAdminSession, setSelectedSiteId } from "../../../lib/admin";

export async function selectSiteAction(formData: FormData) {
  await requireAdminSession();

  const siteId = String(formData.get("siteId") ?? "").trim();

  if (!siteId) {
    redirect("/admin/sites");
  }

  await setSelectedSiteId(siteId);
  redirect("/admin");
}
