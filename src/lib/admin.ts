import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "./supabase/server";

const SITE_COOKIE = "admin_site_id";

export async function requireAdminSession() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/admin/login");
  }

  return data.user;
}

export async function getSelectedSiteId() {
  const cookieStore = await cookies();
  return cookieStore.get(SITE_COOKIE)?.value ?? "";
}

export async function setSelectedSiteId(siteId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SITE_COOKIE, siteId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearSelectedSiteId() {
  const cookieStore = await cookies();
  cookieStore.set(SITE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
