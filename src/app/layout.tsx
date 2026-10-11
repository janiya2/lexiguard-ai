import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LexiGuard AI — On-Chain Legal Intelligence & Automated Compliance Vault",
  description:
    "Instant AI legal contract risk auditing, automated clause redlining, and immutable cryptographic proof of existence on the EVM blockchain.",
  keywords: [
    "Legal Tech",
    "Blockchain Legal Institute",
    "Smart Contract Notary",
    "AI Contract Audit",
    "Web3 Legal",
    "InnoXpert",
    "DoraHacks"
  ],
  authors: [{ name: "InnoXpert Studio", url: "https://innoxpert.com" }],
  openGraph: {
    title: "LexiGuard AI — On-Chain Legal Intelligence & Compliance Vault",
    description:
      "Audit contracts with AI, detect predatory clauses, and notarize tamper-proof legal hashes directly to the blockchain.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-cyan-500/30 selection:text-cyan-200`}
      >
        {children}
      </body>
    </html>
  );
}
