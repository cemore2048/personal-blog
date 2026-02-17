import { headers } from "next/headers";

import { createServerSupabaseClient } from "./supabase/server";

export type SiteRecord = {
  id: string;
  name: string;
  domain: string;
};

export type SiteContext = {
  hostname: string;
  domain: string;
  isAdmin: boolean;
  site: SiteRecord | null;
  error?: string;
};

function normalizeHostname(hostname: string) {
  return hostname.split(":")[0].trim().toLowerCase();
}

export async function resolveSiteContext(): Promise<SiteContext> {
  const headerList = await headers();
  const rawHost = headerList.get("host") ?? "";
  const hostname = normalizeHostname(rawHost);
  const isAdmin = hostname.startsWith("admin.");
  const domain = isAdmin ? hostname.slice("admin.".length) : hostname;
  const isLocalhost =
    domain === "localhost" || domain === "127.0.0.1" || domain === "::1";
  const domainOverride = (process.env.SITE_DOMAIN_OVERRIDE ?? "").trim();

  if (!domain) {
    return {
      hostname,
      domain,
      isAdmin,
      site: null,
      error: "Missing hostname.",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const lookupDomain = isLocalhost && domainOverride ? domainOverride : domain;
    const { data, error } = await supabase
      .from("sites")
      .select("id, name, domain")
      .eq("domain", lookupDomain)
      .maybeSingle();

    if (error) {
      return { hostname, domain, isAdmin, site: null, error: error.message };
    }

    if (!data && isLocalhost && !domainOverride) {
      const { data: fallbackSite, error: fallbackError } = await supabase
        .from("sites")
        .select("id, name, domain")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (fallbackError) {
        return {
          hostname,
          domain,
          isAdmin,
          site: null,
          error: fallbackError.message,
        };
      }

      return { hostname, domain, isAdmin, site: fallbackSite ?? null };
    }

    return { hostname, domain, isAdmin, site: data ?? null };
  } catch (error) {
    return {
      hostname,
      domain,
      isAdmin,
      site: null,
      error: error instanceof Error ? error.message : "Unknown error.",
    };
  }
}
