"use client";

import * as React from "react";
import { Chess } from "chess.js";
import type { AnalysisMoment, PieceColor } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BoardView } from "@/components/board/BoardView";

export interface ReplayViewProps {
  moment: AnalysisMoment;
  /** Colore dal cui lato orientare la scacchiera. */
  orientation: PieceColor;
  onBack: () => void;
}

function squaresOf(uci: string): { from: string; to: string } {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4) };
}

function applyUci(fen: string, uci: string): string {
  const chess = new Chess(fen);
  try {
    chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci.slice(4, 5) : undefined,
    });
  } catch {
    return fen;
  }
  return chess.fen();
}

type Mode = "start" | "played" | "best" | "try";

/**
 * Rivive la posizione di un errore: mostra la mossa giocata, la mossa migliore
 * e permette di rigiocare liberamente dalla posizione (senza motore).
 */
export function ReplayView({ moment, orientation, onBack }: ReplayViewProps) {
  const tryChess = React.useRef<Chess>(new Chess(moment.fenBefore));
  const [mode, setMode] = React.useState<Mode>("start");
  const [fen, setFen] = React.useState<string>(moment.fenBefore);
  const [lastMove, setLastMove] = React.useState<{ from: string; to: string } | null>(null);

  const showPlayed = () => {
    setMode("played");
    setFen(applyUci(moment.fenBefore, moment.playedUci));
    setLastMove(squaresOf(moment.playedUci));
  };

  const showBest = () => {
    setMode("best");
    setFen(applyUci(moment.fenBefore, moment.bestUci));
    setLastMove(squaresOf(moment.bestUci));
  };

  const startTry = () => {
    tryChess.current = new Chess(moment.fenBefore);
    setMode("try");
    setFen(moment.fenBefore);
    setLastMove(null);
  };

  const reset = () => {
    setMode("start");
    setFen(moment.fenBefore);
    setLastMove(null);
  };

  const onMove = (from: string, to: string, promotion?: string): boolean => {
    let move;
    try {
      move = tryChess.current.move({ from, to, promotion: promotion ?? "q" });
    } catch {
      return false;
    }
    if (!move) return false;
    setFen(tryChess.current.fen());
    setLastMove({ from: move.from, to: move.to });
    return true;
  };

  const caption =
    mode === "played"
      ? `Hai giocato ${moment.playedSan}.`
      : mode === "best"
        ? `La mossa migliore era ${moment.bestSan}.`
        : mode === "try"
          ? "Tocca a te: prova la posizione muovendo i pezzi."
          : "Questa è la posizione prima della tua mossa.";

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
        ← Torna alla review
      </Button>

      <BoardView
        fen={fen}
        orientation={orientation === "w" ? "white" : "black"}
        draggable={mode === "try"}
        lastMove={lastMove}
        bestArrow={mode === "start" ? squaresOf(moment.bestUci) : null}
        onMove={onMove}
      />

      <p className="text-center text-sm text-muted-foreground">{caption}</p>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={showPlayed}>
          La tua mossa
        </Button>
        <Button variant="outline" size="sm" onClick={showBest}>
          La mossa migliore
        </Button>
        <Button variant="secondary" size="sm" onClick={startTry}>
          Rigioca da qui
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          Posizione iniziale
        </Button>
      </div>
    </div>
  );
}
