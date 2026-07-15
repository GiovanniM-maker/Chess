"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ChevronRight, Play, TrendingUp, Users, History, Info } from "lucide-react";
import { usePlayer } from "@/lib/player/use-player";
import { BOT_LEVELS } from "@/lib/bot";
import { CALIBRATION_TOTAL_GAMES } from "@/lib/player";

const SECONDARY = [
  {
    href: "/friend",
    title: "Gioca con un amico",
    description: "Invia un link: si entra subito, senza account.",
    icon: Users,
  },
  {
    href: "/learn",
    title: "Impara",
    description: "Il percorso in capitoli, dai fondamenti ai finali.",
    icon: BookOpen,
  },
  {
    href: "/progress",
    title: "I tuoi progressi",
    description: "Competenze, abitudini e quanta strada hai fatto.",
    icon: TrendingUp,
  },
  {
    href: "/history",
    title: "Storico partite",
    description: "Riapri, rivedi e analizza le partite giocate.",
    icon: History,
  },
  {
    href: "/about",
    title: "Informazioni",
    description: "Cos'è questo prototipo e come funziona.",
    icon: Info,
  },
];

/**
 * Home a UNA azione (PEDAGOGIA §6-bis): l'app decide il prossimo passo —
 * calibrazione se il Rivale non esiste ancora, altrimenti la sfida al Rivale
 * con la missione attiva. Tutto il resto è secondario.
 */
export default function HomePage() {
  const player = usePlayer();

  const calibrated = player.profile?.rivalLevel != null;
  const rivalConfig =
    player.profile?.rivalLevel != null ? BOT_LEVELS[player.profile.rivalLevel] : null;

  return (
    <div className="space-y-6">
      <section className="space-y-2 py-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Impara a ragionare negli scacchi</h1>
        </div>
        {player.grade && player.profile && player.profile.dominatedLevel >= 0 && (
          <p className="text-sm text-muted-foreground">
            Il tuo grado:{" "}
            <span className="font-semibold text-foreground">
              {player.grade.glyph} {player.grade.label}
            </span>{" "}
            — conquistato dominando il livello {player.profile.dominatedLevel}.
          </p>
        )}
      </section>

      <Link href="/play" className="block">
        <Card className="border-2 border-primary bg-primary/5 transition-colors hover:bg-primary/10">
          <CardContent className="flex items-center gap-4 p-6">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Play className="h-7 w-7" />
            </span>
            <span className="flex-1">
              {player.loading ? (
                <span className="block font-semibold">Caricamento…</span>
              ) : calibrated && rivalConfig ? (
                <>
                  <span className="block text-lg font-bold">
                    Sfida il tuo Rivale — Livello {player.profile!.rivalLevel} · {rivalConfig.label}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {player.mission
                      ? `🎯 Missione: ${player.mission.text.toLowerCase()}`
                      : "Battilo con costanza e salirà di livello."}
                  </span>
                </>
              ) : (
                <>
                  <span className="block text-lg font-bold">Scopri il tuo livello</span>
                  <span className="block text-sm text-muted-foreground">
                    {CALIBRATION_TOTAL_GAMES} partite di calibrazione e ti assegniamo il tuo Rivale
                    personale.
                  </span>
                </>
              )}
            </span>
            <ChevronRight className="h-6 w-6 text-primary" />
          </CardContent>
        </Card>
      </Link>

      <div className="space-y-3">
        {SECONDARY.map((entry) => {
          const Icon = entry.icon;
          return (
            <Link key={entry.href} href={entry.href} className="block">
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
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
