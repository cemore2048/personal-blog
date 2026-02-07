import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "rmoreno.cesar@gmail.com";

export async function requireAdminUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (user.email !== ADMIN_EMAIL) {
    redirect("/");
  }

  return { supabase, user };
}
