"use client";

import * as React from "react";
import Link from "next/link";
import { Flame, Lock } from "lucide-react";
import { getPlayerProfile, listGames } from "@/lib/storage";
import {
  allTitles,
  buildHabits,
  earnedTitles,
  gradeFor,
  gradeLadder,
  type EarnedTitle,
  type HabitProgress,
  type PlayerProfile,
} from "@/lib/player";
import { BOT_LEVELS } from "@/lib/bot";
import type { SavedGame } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

/**
 * Gradi e titoli: rende VISIBILE la progressione che l'app costruisce in
 * silenzio. Due assi distinti e onesti:
 *  - il Grado sale dominando Rivali sempre più forti (miglioramento oggettivo);
 *  - i Titoli si conquistano ripetendo buone abitudini, mai col volume.
 */
export default function RankPage() {
  const [profile, setProfile] = React.useState<PlayerProfile | null>(null);
  const [games, setGames] = React.useState<SavedGame[] | null>(null);

  React.useEffect(() => {
    void Promise.all([getPlayerProfile(), listGames()]).then(([loadedProfile, loadedGames]) => {
      setProfile(loadedProfile);
      setGames(loadedGames);
    });
  }, []);

  if (!profile || !games) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Caricamento…</p>;
  }

  const currentGrade = gradeFor(profile.dominatedLevel);
  const ladder = gradeLadder();
  const habits = buildHabits(games);
  const earned = earnedTitles(games);
  const earnedIds = new Set(earned.map((title) => title.id));
  const locked = allTitles().filter((title) => !earnedIds.has(title.id));

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <h1 className="text-xl font-bold">Gradi e titoli</h1>
        <p className="text-sm text-muted-foreground">
          Il tuo percorso, reso visibile. Niente sale col numero di partite: tutto si conquista
          giocando meglio.
        </p>
      </section>

      {/* ── Scala dei gradi ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Il tuo grado</h2>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-lg font-bold">
              {currentGrade.glyph} {currentGrade.label}
            </p>
            <p className="text-sm text-muted-foreground">
              {profile.rivalLevel != null
                ? `Rivale attuale: Livello ${profile.rivalLevel} — ${BOT_LEVELS[profile.rivalLevel].label}. Battilo con costanza per salire.`
                : "Completa la calibrazione (3 partite) per ricevere il tuo Rivale e iniziare a scalare."}
            </p>
          </CardContent>
        </Card>

        <ol className="space-y-1.5">
          {[...ladder].reverse().map((rung) => {
            const isCurrent = rung.grade.id === currentGrade.id;
            const reached = profile.dominatedLevel >= rung.minLevel;
            return (
              <li
                key={rung.grade.id}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  isCurrent
                    ? "border-primary bg-primary/10"
                    : reached
                      ? "border-transparent bg-secondary"
                      : "border-transparent opacity-60"
                }`}
              >
                <span className="text-xl" aria-hidden>
                  {rung.grade.glyph}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{rung.grade.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {rung.minLevel < 0 ? "Punto di partenza" : `Domina il Livello ${rung.minLevel}`}
                  </span>
                </span>
                {isCurrent && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    Sei qui
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── Streak comportamentali ───────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Le tue abitudini in corso</h2>
        {habits.every((habit) => habit.applicableGames === 0) ? (
          <p className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
            Gioca e analizza qualche partita: qui vedrai crescere le tue serie positive.
          </p>
        ) : (
          <div className="space-y-2">
            {habits.map((habit) => (
              <HabitRow key={habit.id} habit={habit} />
            ))}
          </div>
        )}
      </section>

      {/* ── Bacheca dei titoli ───────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Titoli conquistati ({earned.length}/{allTitles().length})
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {earned.map((title) => (
            <TitleCard key={title.id} title={title} earned />
          ))}
          {locked.map((title) => (
            <TitleCard key={title.id} title={title} earned={false} />
          ))}
        </div>
      </section>

      <Link href="/play" className={buttonVariants({ className: "w-full" })}>
        Gioca per salire
      </Link>
    </div>
  );
}

function HabitRow({ habit }: { habit: HabitProgress }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{habit.label}</span>
          <span
            className={`flex items-center gap-1 text-sm font-bold ${
              habit.current > 0 ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Flame className="h-4 w-4" aria-hidden />
            {habit.current}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {habit.current > 0
            ? `${habit.current} ${habit.streakNoun} di fila`
            : `Nessuna serie in corso · ${habit.streakNoun}`}
          {habit.best > habit.current ? ` · record: ${habit.best}` : ""}
        </p>
        {habit.nextTitle && (
          <p className="text-xs text-primary">
            Ancora {habit.nextTitle.remaining} per il titolo “{habit.nextTitle.title.label}”{" "}
            {habit.nextTitle.title.glyph}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TitleCard({ title, earned }: { title: EarnedTitle; earned: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center ${
        earned ? "border-primary/40 bg-primary/5" : "opacity-60"
      }`}
    >
      <span className="text-2xl" aria-hidden>
        {earned ? title.glyph : <Lock className="h-6 w-6 text-muted-foreground" />}
      </span>
      <span className="text-sm font-semibold">{title.label}</span>
      <span className="text-xs text-muted-foreground">{title.requirement}</span>
    </div>
  );
}
