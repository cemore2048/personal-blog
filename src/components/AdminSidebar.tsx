"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { createNewPostAction } from "../app/admin/posts/actions";

type AdminSidebarProps = {
  siteName: string;
  publicUrl: string;
};

function IconAllPosts() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconNewPost() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconViewSite() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export default function AdminSidebar({ siteName, publicUrl }: AdminSidebarProps) {
  const pathname = usePathname();
  const isPostsList = pathname === "/admin/posts" || pathname === "/admin";

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h2 className="admin-sidebar-title">{siteName}</h2>
        <p className="admin-sidebar-subtitle">Admin Panel</p>
      </div>
      <nav className="admin-sidebar-nav">
        <Link
          href="/admin/posts"
          className={`admin-sidebar-link ${isPostsList ? "admin-sidebar-link--active" : ""}`}
        >
          <IconAllPosts />
          All Posts
        </Link>
        <form action={createNewPostAction}>
          <button type="submit" className="admin-sidebar-link admin-sidebar-link--button">
            <IconNewPost />
            New Post
          </button>
        </form>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-sidebar-link"
        >
          <IconViewSite />
          View Public Site
        </a>
      </nav>
    </aside>
  );
}
