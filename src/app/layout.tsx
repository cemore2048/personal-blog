import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Personal Blog",
  description: "Personal blog powered by Next.js and Supabase"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-white text-slate-900">
          <header className="border-b border-slate-200">
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-lg font-semibold text-slate-900">
                Personal Blog
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/">Posts</Link>
                <Link href="/admin">Dashboard</Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-4xl px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
