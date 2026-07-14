import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pensa — Prototipo",
  description:
    "Prototipo tecnico: gioca contro un bot e ricevi una spiegazione educativa dei tuoi tre errori principali.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-dvh antialiased">
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4">
          <header className="flex items-center justify-between py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Pensa<span className="text-primary">.</span>
            </Link>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/history" className="hover:text-foreground">
                Storico
              </Link>
              <Link href="/about" className="hover:text-foreground">
                Info
              </Link>
            </nav>
          </header>
          <main className="flex-1 pb-10">{children}</main>
          <footer className="border-t py-4 text-center text-xs text-muted-foreground">
            Prototipo tecnico · gira interamente nel tuo browser
          </footer>
        </div>
      </body>
    </html>
  );
}
