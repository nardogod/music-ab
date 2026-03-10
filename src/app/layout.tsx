import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Music Analyzer Pro - Análise de Áudio Profissional",
  description:
    "Analise suas músicas com precisão profissional. BPM, Key, espectro de frequências, energia e muito mais - tudo no seu navegador.",
  keywords: [
    "análise de áudio",
    "BPM",
    "key detection",
    "music analyzer",
    "waveform",
    "espectrograma",
  ],
  authors: [{ name: "Music Analyzer Pro" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Music Analyzer Pro",
    description: "Análise de áudio profissional no navegador",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
