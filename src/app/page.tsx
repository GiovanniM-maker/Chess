import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Play, Users, History, Info } from "lucide-react";

const ENTRIES = [
  {
    href: "/play",
    title: "Nuova partita",
    description: "Gioca contro un bot (livelli 0–10) e scopri i tuoi errori.",
    icon: Play,
  },
  {
    href: "/friend",
    title: "Gioca con un amico",
    description: "Crea una partita e invia il link: si entra subito, senza account.",
    icon: Users,
  },
  {
    href: "/history",
    title: "Storico partite",
    description: "Riapri, rivedi e analizza le partite già giocate.",
    icon: History,
  },
  {
    href: "/about",
    title: "Informazioni",
    description: "Cos'è questo prototipo e come funziona.",
    icon: Info,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2 py-4">
        <h1 className="text-3xl font-bold tracking-tight">Impara a ragionare negli scacchi</h1>
        <p className="text-muted-foreground">
          Gioca una partita e scopri i tuoi tre errori principali, spiegati in modo semplice.
        </p>
      </section>

      <div className="space-y-3">
        {ENTRIES.map((entry) => {
          const Icon = entry.icon;
          return (
            <Link key={entry.href} href={entry.href} className="block">
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold">{entry.title}</span>
                    <span className="block text-sm text-muted-foreground">{entry.description}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
