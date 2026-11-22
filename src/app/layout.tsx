import type { Metadata } from "next";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import { Nav } from "@/components/nav";
import { ProfileProvider, SpeechProvider } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const notoArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Polyglotte — anglais, espagnol, arabe",
  description:
    "Apprendre l'anglais, l'espagnol et l'arabe : répétition espacée, histoires audio, tuteur IA à l'oral et correction de l'écrit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${notoArabic.variable}`}>
      <body className="font-sans">
        <ProfileProvider>
          <SpeechProvider>
            <Nav />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          </SpeechProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
