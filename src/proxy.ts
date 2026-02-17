import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function normalizeHostname(hostname: string) {
  return hostname.split(":")[0].trim().toLowerCase();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = normalizeHostname(host);
  const isAdminHost = hostname.startsWith("admin.");
  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname.startsWith("/admin");
  const adminPath = isAdminHost
    ? isAdminPath
      ? pathname
      : `/admin${pathname === "/" ? "" : pathname}`
    : pathname;

  let response = NextResponse.next();

  if (isAdminHost && !isAdminPath) {
    const url = request.nextUrl.clone();
    url.pathname = adminPath;
    response = NextResponse.rewrite(url);
  }

  if (adminPath.startsWith("/admin") && !adminPath.startsWith("/admin/login")) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return response;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    });

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
