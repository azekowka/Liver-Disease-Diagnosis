import type { Metadata } from "next";
import { Manrope, Onest, IBM_Plex_Mono } from "next/font/google";
import AppFrame from "@/components/AppFrame";
import "./globals.css";

// Soft humanist display (warm, readable), clean Cyrillic UI face, tabular mono for data.
const display = Manrope({ subsets: ["latin", "cyrillic"], weight: ["500", "600", "700", "800"], variable: "--font-display" });
const body = Onest({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "MedLiver - AI-модель для выявления заболеваний печени",
  description: "AI-модель для выявления заболеваний печени",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
