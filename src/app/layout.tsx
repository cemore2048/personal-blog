import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Blog",
  description: "Single-owner, multi-site headless CMS baseline",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
