import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Capturia Funnel Builder",
  description: "Pages Next.js construites dynamiquement depuis un JSON.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
