"use client";

import * as React from "react";
import { Chess } from "chess.js";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AnalysisMoment, PieceColor } from "@/lib/types";
import { uciSquares } from "@/lib/chess";
import { formatEval } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { BoardView } from "@/components/board/BoardView";
import { cn } from "@/lib/utils";
import { BEST_ARROW_COLOR } from "./MomentCard";

export interface ReplayViewProps {
  moment: AnalysisMoment;
  /** Colore dal cui lato orientare la scacchiera. */
  orientation: PieceColor;
  onBack: () => void;
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

/** Posizione e ultima mossa dopo aver applicato i primi `steps` semimosse SAN. */
function positionAfterLine(
  fenStart: string,
  lineSan: string[],
  steps: number,
): { fen: string; lastMove: { from: string; to: string } | null } {
  const chess = new Chess(fenStart);
  let lastMove: { from: string; to: string } | null = null;
  for (const san of lineSan.slice(0, steps)) {
    try {
      const move = chess.move(san);
      lastMove = { from: move.from, to: move.to };
    } catch {
      break;
    }
  }
  return { fen: chess.fen(), lastMove };
}

type Mode = "start" | "played" | "best" | "try" | "variant";

/**
 * Rivive la posizione di un errore: la mossa giocata, la migliore, le
 * VARIANTI del motore esplorabili mossa per mossa (con la valutazione a cui
 * portano) e la possibilità di rigiocare liberamente dalla posizione.
 */
export function ReplayView({ moment, orientation, onBack }: ReplayViewProps) {
  const tryChess = React.useRef<Chess>(new Chess(moment.fenBefore));
  const [mode, setMode] = React.useState<Mode>("start");
  const [fen, setFen] = React.useState<string>(moment.fenBefore);
  const [lastMove, setLastMove] = React.useState<{ from: string; to: string } | null>(null);
  const [variantIndex, setVariantIndex] = React.useState(0);
  const [variantStep, setVariantStep] = React.useState(1);

  const alternatives = moment.alternatives ?? [];
  const activeVariant = mode === "variant" ? alternatives[variantIndex] : undefined;

  const showPlayed = () => {
    setMode("played");
    setFen(applyUci(moment.fenBefore, moment.playedUci));
    setLastMove(uciSquares(moment.playedUci));
  };

  const showBest = () => {
    setMode("best");
    setFen(applyUci(moment.fenBefore, moment.bestUci));
    setLastMove(uciSquares(moment.bestUci));
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

  const openVariant = (index: number) => {
    setMode("variant");
    setVariantIndex(index);
    applyVariantStep(index, 1);
  };

  const applyVariantStep = (index: number, step: number) => {
    const variant = alternatives[index];
    if (!variant) return;
    const clamped = Math.min(Math.max(1, step), variant.lineSan.length);
    const position = positionAfterLine(moment.fenBefore, variant.lineSan, clamped);
    setVariantStep(clamped);
    setFen(position.fen);
    setLastMove(position.lastMove);
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
          : mode === "variant" && activeVariant
            ? `Variante ${activeVariant.san}: porta a una valutazione di ${formatEval(activeVariant.scoreCp)}.`
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
        arrows={
          mode === "start" ? [{ ...uciSquares(moment.bestUci), color: BEST_ARROW_COLOR }] : []
        }
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

      {alternatives.length > 0 && (
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-sm font-medium">Cosa potevi giocare (varianti del motore)</p>
          <div className="flex flex-wrap gap-2">
            {alternatives.map((alternative, index) => (
              <button
                key={alternative.uci + index}
                type="button"
                onClick={() => openVariant(index)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  mode === "variant" && variantIndex === index
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent",
                )}
              >
                {alternative.san}{" "}
                <span className="text-xs opacity-80">({formatEval(alternative.scoreCp)})</span>
              </button>
            ))}
          </div>

          {mode === "variant" && activeVariant && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {activeVariant.lineSan.map((san, index) => (
                  <span
                    key={index}
                    className={cn(
                      "mr-1",
                      index < variantStep ? "font-semibold text-foreground" : "opacity-60",
                    )}
                  >
                    {san}
                  </span>
                ))}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Mossa precedente della variante"
                  disabled={variantStep <= 1}
                  onClick={() => applyVariantStep(variantIndex, variantStep - 1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {variantStep}/{activeVariant.lineSan.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Mossa successiva della variante"
                  disabled={variantStep >= activeVariant.lineSan.length}
                  onClick={() => applyVariantStep(variantIndex, variantStep + 1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
