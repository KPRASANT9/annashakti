import type { Metadata } from "next";
import { Literata, Syne, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["500", "600", "700", "800"],
});

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  weight: ["400", "500", "600", "700"],
});

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Annashakti — The plate that trains with you",
  description:
    "Annashakti — putting the Indian body back together. The plate that trains with you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${literata.variable} ${plex.variable}`}>
      <body
        style={
          {
            "--font-display": "var(--font-syne), Syne, sans-serif",
            "--font-body": "var(--font-literata), Literata, Georgia, serif",
            "--font-mono": "var(--font-plex), IBM Plex Mono, monospace",
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
