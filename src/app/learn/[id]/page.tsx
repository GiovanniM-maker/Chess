"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Chess } from "chess.js";
import { getLesson, sanEquals } from "@/lib/learn/lessons";
import { getLessonProgress, markExerciseDone, setActiveMission } from "@/lib/storage";
import { missionForLesson } from "@/lib/player";
import type { LessonProgress } from "@/lib/learn/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BoardView } from "@/components/board/BoardView";

type Step = "intro" | number | "done"; // number = indice esercizio

/**
 * Player della lezione: spiegazione → esercizi sulla scacchiera → riepilogo
 * con l'unica azione da portarsi nella prossima partita. Le lezioni sono dati
 * (content-driven): questo player non conosce i contenuti.
 */
export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const lesson = getLesson(params.id);

  const [step, setStep] = React.useState<Step>("intro");
  const [fen, setFen] = React.useState<string | null>(null);
  const [attempted, setAttempted] = React.useState(0);
  const [solved, setSolved] = React.useState(false);
  const [lastMove, setLastMove] = React.useState<{ from: string; to: string } | null>(null);
  const [progress, setProgress] = React.useState<LessonProgress | null>(null);
  const missionActivatedRef = React.useRef(false);

  React.useEffect(() => {
    if (!lesson) return;
    void getLessonProgress(lesson.id).then((loaded) => setProgress(loaded ?? null));
  }, [lesson]);

  // Mastery Loop: la lezione è "imparata" solo quando l'azione si vede in
  // partita. Al completamento attiviamo la missione verificabile collegata.
  React.useEffect(() => {
    if (step !== "done" || !lesson || missionActivatedRef.current) return;
    missionActivatedRef.current = true;
    const mission = missionForLesson(lesson.id);
    if (mission) void setActiveMission(mission.id, lesson.id);
  }, [step, lesson]);

  if (!lesson) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-muted-foreground">Lezione non trovata.</p>
        <Link href="/learn" className={buttonVariants({ variant: "outline" })}>
          Torna alle lezioni
        </Link>
      </div>
    );
  }

  const exerciseIndex = typeof step === "number" ? step : null;
  const exercise = exerciseIndex !== null ? lesson.exercises[exerciseIndex] : undefined;

  const startExercise = (index: number) => {
    const target = lesson.exercises[index];
    if (!target) {
      setStep("done");
      return;
    }
    setStep(index);
    setFen(target.fen);
    setAttempted(0);
    setSolved(false);
    setLastMove(null);
  };

  const onMove = (from: string, to: string, promotion?: string): boolean => {
    if (!exercise || solved || fen === null) return false;
    const chess = new Chess(fen);
    let move;
    try {
      move = chess.move({ from, to, promotion: promotion ?? "q" });
    } catch {
      return false;
    }
    if (!move) return false;

    const isCorrect = exercise.solutions.some((solution) => sanEquals(solution, move.san));
    if (!isCorrect) {
      setAttempted((count) => count + 1);
      return false; // il pezzo torna indietro: riprova
    }
    setFen(chess.fen());
    setLastMove({ from: move.from, to: move.to });
    setSolved(true);
    void markExerciseDone(lesson.id, exercise.id, lesson.exercises.length).then(setProgress);
    return true;
  };

  if (step === "intro") {
    return (
      <div className="space-y-5">
        <Link
          href="/learn"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2" })}
        >
          ← Lezioni
        </Link>
        <h1 className="text-xl font-bold">{lesson.title}</h1>
        <div className="space-y-3">
          {lesson.explanation.map((paragraph, index) => (
            <p key={index} className="text-sm leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>
        <Button size="lg" className="w-full" onClick={() => startExercise(0)}>
          Inizia gli esercizi ({lesson.exercises.length})
        </Button>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="space-y-5 text-center">
        <div className="text-4xl" aria-hidden>
          ✅
        </div>
        <h1 className="text-xl font-bold">Lezione completata!</h1>
        <Card className="border-primary/30">
          <CardContent className="p-4">
            <p className="text-sm font-medium">La tua unica missione per la prossima partita:</p>
            <p className="mt-1 text-sm text-primary">{lesson.actionReminder}</p>
            {missionForLesson(lesson.id) && (
              <p className="mt-2 text-xs text-muted-foreground">
                🎯 Missione attivata: la verifichiamo insieme nella review della prossima partita
                ufficiale.
              </p>
            )}
          </CardContent>
        </Card>
        <div className="space-y-2">
          <Link href="/play" className={buttonVariants({ size: "lg", className: "w-full" })}>
            Mettila in pratica: gioca ora
          </Link>
          <Link
            href="/learn"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            Torna alle lezioni
          </Link>
        </div>
      </div>
    );
  }

  if (!exercise || fen === null) return null;

  // L'orientamento dipende da chi muove NELLA POSIZIONE INIZIALE dell'esercizio
  // (non dalla posizione corrente: dopo la soluzione il tratto cambia e la
  // scacchiera si ribalterebbe).
  const orientation = exercise.fen.includes(" w ") ? "white" : "black";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/learn"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2" })}
        >
          ← Lezioni
        </Link>
        <span className="text-xs tabular-nums text-muted-foreground">
          Esercizio {exerciseIndex! + 1} di {lesson.exercises.length}
          {progress?.completedAt ? " · già completata" : ""}
        </span>
      </div>

      <p className="text-sm font-medium">{exercise.prompt}</p>

      <BoardView
        fen={fen}
        orientation={orientation}
        draggable={!solved}
        lastMove={lastMove}
        onMove={onMove}
      />

      {solved ? (
        <div className="space-y-2">
          <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
            {exercise.successText}
          </p>
          <Button size="lg" className="w-full" onClick={() => startExercise(exerciseIndex! + 1)}>
            {exerciseIndex! + 1 < lesson.exercises.length
              ? "Prossimo esercizio"
              : "Concludi la lezione"}
          </Button>
        </div>
      ) : attempted > 0 ? (
        <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
          Non è la mossa giusta qui. Suggerimento: {exercise.hint}
        </p>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Muovi il pezzo giusto sulla scacchiera.
        </p>
      )}
    </div>
  );
}
