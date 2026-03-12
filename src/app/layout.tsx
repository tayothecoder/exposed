import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exposed - Digital Safety Scanner",
  description: "See what is publicly exposed about you online",
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
