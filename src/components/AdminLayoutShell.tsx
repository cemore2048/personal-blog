"use client";

import { usePathname } from "next/navigation";

import AdminSidebar from "./AdminSidebar";

type AdminLayoutShellProps = {
  children: React.ReactNode;
  siteName: string;
  publicUrl: string;
};

export default function AdminLayoutShell({
  children,
  siteName,
  publicUrl,
}: AdminLayoutShellProps) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <AdminSidebar siteName={siteName} publicUrl={publicUrl} />
      <div className="admin-main">{children}</div>
    </div>
  );
}
