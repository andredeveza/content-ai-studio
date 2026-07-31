import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Tipografia do chrome do produto (design_handoff_content_ai_studio/README.md,
// seção "Chrome do produto"): Space Grotesk na UI, JetBrains Mono em
// rótulos/meta/logs. Não é a fonte do Brand Kit do cliente — essa entra
// via CSS custom properties no canvas do slide (bloco 4), nunca aqui.
const chromeSans = Space_Grotesk({
  variable: "--font-chrome-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const chromeMono = JetBrains_Mono({
  variable: "--font-chrome-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Content AI Studio",
  description: "Gerador de carrosséis de Instagram com IA e Brand Kit do cliente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${chromeSans.variable} ${chromeMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
