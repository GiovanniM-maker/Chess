"use client";

import * as React from "react";
import Link from "next/link";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { getPlayerProfile, listGames, listLessonProgress } from "@/lib/storage";
import { gradeFor, type PlayerProfile } from "@/lib/player";
import { BOT_LEVELS } from "@/lib/bot";
import {
  buildInsights,
  buildMemories,
  buildSkillProfile,
  type CognitiveInsight,
  type LearningMemory,
  type SkillState,
} from "@/lib/skills";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const STATUS_LABEL: Record<SkillState["status"], string> = {
  "da-introdurre": "Da introdurre",
  "in-apprendimento": "In apprendimento",
  stabile: "Stabile",
};

const STATUS_VARIANT: Record<SkillState["status"], "secondary" | "default" | "outline"> = {
  "da-introdurre": "outline",
  "in-apprendimento": "secondary",
  stabile: "default",
};

function TrendIcon({ trend }: { trend: SkillState["trend"] }) {
  if (trend === "miglioramento") return <TrendingUp className="h-4 w-4 text-primary" />;
  if (trend === "peggioramento") return <TrendingDown className="h-4 w-4 text-destructive" />;
  if (trend === "stabile") return <Minus className="h-4 w-4 text-muted-foreground" />;
  return null;
}

function SkillCard({ skill }: { skill: SkillState }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">{skill.label}</span>
          <span className="flex items-center gap-2">
            <TrendIcon trend={skill.trend} />
            <Badge variant={STATUS_VARIANT[skill.status]}>{STATUS_LABEL[skill.status]}</Badge>
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{skill.description}</p>
        <p className="text-xs text-muted-foreground">
          {skill.evidenceCount === 0
            ? "Ancora nessuna osservazione: gioca e completa lezioni per popolarla."
            : `${skill.evidenceCount} osservazioni · confidenza ${skill.confidence}` +
              (skill.recentErrors.length > 0
                ? ` · ${skill.recentErrors.length} errori recenti collegati`
                : "")}
        </p>
        {skill.lessonId && !skill.lessonCompleted && (
          <Link
            href={`/learn/${skill.lessonId}`}
            className="block rounded-lg border border-primary/30 bg-primary/5 p-2 text-sm hover:bg-primary/10"
          >
            📘 Lezione consigliata
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProgressPage() {
  const [skills, setSkills] = React.useState<SkillState[] | null>(null);
  const [insights, setInsights] = React.useState<CognitiveInsight[]>([]);
  const [memories, setMemories] = React.useState<LearningMemory[]>([]);
  const [analyzedCount, setAnalyzedCount] = React.useState(0);
  const [profile, setProfile] = React.useState<PlayerProfile | null>(null);

  React.useEffect(() => {
    void Promise.all([listGames(), listLessonProgress(), getPlayerProfile()]).then(
      ([games, lessons, loadedProfile]) => {
        setSkills(buildSkillProfile(games, lessons));
        setInsights(buildInsights(games));
        setMemories(buildMemories(games));
        setAnalyzedCount(games.filter((game) => game.analysis).length);
        setProfile(loadedProfile);
      },
    );
  }, []);

  if (skills === null) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Caricamento…</p>;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-xl font-bold">I tuoi progressi</h1>
        <p className="text-sm text-muted-foreground">
          Basati su{" "}
          {analyzedCount === 1 ? "1 partita analizzata" : `${analyzedCount} partite analizzate`}
          {analyzedCount < 3
            ? " — più giochi (e analizzi), più il quadro diventa affidabile."
            : "."}
        </p>
      </section>

      {profile && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-1 p-4">
            <p className="text-sm font-semibold">
              {gradeFor(profile.dominatedLevel).glyph} Grado:{" "}
              {gradeFor(profile.dominatedLevel).label}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile.rivalLevel != null
                ? `Il tuo Rivale: Livello ${profile.rivalLevel} — ${BOT_LEVELS[profile.rivalLevel].label}. ` +
                  (profile.dominatedLevel >= 0
                    ? `Hai già dominato il livello ${profile.dominatedLevel}: il grado sale battendo il Rivale con costanza, non giocando tanto.`
                    : "Il grado sale battendo il Rivale con costanza, non giocando tanto.")
                : "Completa la calibrazione (3 partite) per ricevere il tuo Rivale personale."}
            </p>
          </CardContent>
        </Card>
      )}

      {memories.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Quanta strada hai fatto</h2>
          {memories.map((memory) => (
            <p
              key={memory.id}
              className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm"
            >
              🌱 {memory.text}
            </p>
          ))}
        </section>
      )}

      {insights.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Come pensi quando giochi</h2>
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardContent className="space-y-1 p-4">
                <p className="text-sm leading-relaxed">🧠 {insight.text}</p>
                <p className="text-xs text-muted-foreground">
                  Basato su {insight.samples} osservazioni · confidenza {insight.confidence}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Le tue competenze</h2>
        <div className="space-y-3">
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      </section>

      {analyzedCount === 0 && (
        <div className="space-y-2 rounded-lg border p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Gioca una partita e analizzala: è da lì che nascono i tuoi progressi.
          </p>
          <Link href="/play" className={buttonVariants({})}>
            Gioca ora
          </Link>
        </div>
      )}
    </div>
  );
}
