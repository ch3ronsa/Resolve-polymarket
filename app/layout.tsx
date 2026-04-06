import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "ResolveRadar",
  description:
    "Resolution-focused Polymarket summaries with critical dates, ambiguity flags, and risk labels."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

