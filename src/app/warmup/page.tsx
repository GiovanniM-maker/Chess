"use client";

import * as React from "react";
import Link from "next/link";
import { Chess } from "chess.js";
import { Flame } from "lucide-react";
import { useWarmup } from "@/lib/srs/use-warmup";
import type { ReviewItem } from "@/lib/srs";
import { sanEquals } from "@/lib/learn/lessons";
import { MOMENT_TYPE_LABELS } from "@/lib/analysis/labels";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BoardView } from "@/components/board/BoardView";

type Attempt = "trying" | "success" | "fail";

function formatNextDue(nextDue: number | null): string {
  if (nextDue === null) return "";
  const days = Math.max(1, Math.ceil((nextDue - Date.now()) / (24 * 60 * 60 * 1000)));
  return days === 1 ? "domani" : `tra ${days} giorni`;
}

/**
 * Riscaldamento: il ripasso spaziato degli errori REALI del giocatore.
 * Ogni esercizio è una posizione dalle sue partite analizzate: si rifà la
 * scelta sbagliata finché l'errore non sparisce (Mastery Loop).
 */
export default function WarmupPage() {
  const warmup = useWarmup();

  const [index, setIndex] = React.useState(0);
  const [attempt, setAttempt] = React.useState<Attempt>("trying");
  const [fen, setFen] = React.useState<string | null>(null);
  const [lastMove, setLastMove] = React.useState<{ from: string; to: string } | null>(null);
  const [wrongSan, setWrongSan] = React.useState<string | null>(null);
  const [correctCount, setCorrectCount] = React.useState(0);

  const current: ReviewItem | undefined = warmup.today[index];

  // All'arrivo su un nuovo esercizio la scacchiera riparte dalla sua posizione.
  React.useEffect(() => {
    if (!current) return;
    setFen(current.fen);
    setAttempt("trying");
    setLastMove(null);
    setWrongSan(null);
  }, [current]);

  const onMove = (from: string, to: string, promotion?: string): boolean => {
    if (!current || attempt !== "trying" || fen === null) return false;
    const chess = new Chess(fen);
    let move;
    try {
      move = chess.move({ from, to, promotion: promotion ?? "q" });
    } catch {
      return false; // mossa illegale: il pezzo torna indietro, nessuna penalità
    }
    if (!move) return false;

    const correct = current.solutions.some((solution) => sanEquals(solution, move.san));
    if (correct) {
      setFen(chess.fen());
      setLastMove({ from: move.from, to: move.to });
      setAttempt("success");
      setCorrectCount((count) => count + 1);
      void warmup.record(current, true);
      return true;
    }
    // Un tentativo legale ma sbagliato conta: l'errore torna in coda per domani.
    setWrongSan(move.san);
    setAttempt("fail");
    void warmup.record(current, false);
    return false;
  };

  if (warmup.loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Caricamento…</p>;
  }

  // Coda vuota o niente in scadenza: spiega da dove nascono gli esercizi.
  if (warmup.today.length === 0) {
    return (
      <div className="space-y-4 py-10 text-center">
        <Flame className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
        {warmup.hasAnalyzedGames ? (
          <>
            <h1 className="text-xl font-bold">Tutto ripassato!</h1>
            <p className="text-sm text-muted-foreground">
              Nessun esercizio in scadenza oggi
              {warmup.nextDue ? ` — i prossimi arrivano ${formatNextDue(warmup.nextDue)}` : ""}. Nel
              frattempo, la cosa migliore che puoi fare è giocare.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold">Il riscaldamento nasce dalle tue partite</h1>
            <p className="text-sm text-muted-foreground">
              Qui non ci sono esercizi inventati: rigiochi le posizioni in cui hai sbagliato
              davvero. Gioca una partita e analizzala per generare i tuoi primi esercizi.
            </p>
          </>
        )}
        <Link href="/play" className={buttonVariants({ size: "lg" })}>
          Gioca ora
        </Link>
      </div>
    );
  }

  // Sessione conclusa: riepilogo onesto (niente percentuali gonfiate).
  if (index >= warmup.today.length) {
    return (
      <div className="space-y-4 py-10 text-center">
        <div className="text-4xl" aria-hidden>
          {correctCount === warmup.today.length ? "🔥" : "💪"}
        </div>
        <h1 className="text-xl font-bold">Riscaldamento completato</h1>
        <p className="text-sm text-muted-foreground">
          {correctCount} su {warmup.today.length} al primo colpo.{" "}
          {correctCount === warmup.today.length
            ? "Questi errori stanno sparendo dal tuo gioco."
            : "Quelli sbagliati tornano domani: è così che si consolidano."}
        </p>
        <div className="mx-auto max-w-xs space-y-2">
          <Link href="/play" className={buttonVariants({ size: "lg", className: "w-full" })}>
            Ora mettilo in pratica: gioca
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Torna alla home
          </Link>
        </div>
      </div>
    );
  }

  if (!current || fen === null) return null;

  const orientation = current.playerColor === "w" ? "white" : "black";
  const bestArrow =
    attempt === "fail"
      ? [
          {
            from: current.bestUci.slice(0, 2),
            to: current.bestUci.slice(2, 4),
            color: "rgba(34, 197, 94, 0.85)",
          },
        ]
      : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <Flame className="h-4 w-4 text-primary" aria-hidden /> Riscaldamento
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          Esercizio {index + 1} di {warmup.today.length}
        </span>
      </div>

      <p className="text-sm">
        Posizione da una tua partita —{" "}
        <span className="font-medium">{MOMENT_TYPE_LABELS[current.type]}</span>. Trova la mossa
        migliore per il {current.playerColor === "w" ? "Bianco" : "Nero"}.
      </p>

      <BoardView
        fen={fen}
        orientation={orientation}
        draggable={attempt === "trying"}
        lastMove={lastMove}
        arrows={bestArrow}
        onMove={onMove}
      />

      {attempt === "success" && (
        <div className="space-y-2">
          <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
            Proprio così! In partita avevi giocato {current.playedSan}: questa volta hai visto la
            mossa giusta.
          </p>
          <Button size="lg" className="w-full" onClick={() => setIndex((value) => value + 1)}>
            {index + 1 < warmup.today.length ? "Prossimo esercizio" : "Concludi il riscaldamento"}
          </Button>
        </div>
      )}

      {attempt === "fail" && (
        <div className="space-y-2">
          <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
            {wrongSan} non è la mossa migliore qui. La freccia indica {current.bestSan}
            {sanEquals(current.playedSan, wrongSan ?? "")
              ? " — è lo stesso errore della partita: lo rivedrai domani."
              : ` (in partita avevi giocato ${current.playedSan}). Ci ritorni domani.`}
          </p>
          <Button size="lg" className="w-full" onClick={() => setIndex((value) => value + 1)}>
            {index + 1 < warmup.today.length ? "Prossimo esercizio" : "Concludi il riscaldamento"}
          </Button>
        </div>
      )}

      {attempt === "trying" && (
        <p className="text-center text-sm text-muted-foreground">
          Hai un solo tentativo: pensa come se fossi in partita.
        </p>
      )}
    </div>
  );
}
