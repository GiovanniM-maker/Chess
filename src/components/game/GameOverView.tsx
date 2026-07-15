"use client";

import type { GameResultInfo, PieceColor } from "@/lib/types";
import { kingSquare } from "@/lib/chess";
import { playerOutcome, reasonLabel } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { BoardView } from "@/components/board/BoardView";

const CONFETTI_COLORS = ["#16a34a", "#f59e0b", "#38bdf8", "#f43f5e", "#a78bfa"];
const CONFETTI_COUNT = 16;

/** Coriandoli CSS-only per la vittoria (disattivati con prefers-reduced-motion). */
function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: CONFETTI_COUNT }, (_, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={{
            left: `${(index * 100) / CONFETTI_COUNT + 2}%`,
            backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
            animationDelay: `${(index % 5) * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

export interface GameOverViewProps {
  result: GameResultInfo;
  playerColor: PieceColor;
  /** Posizione finale, mostrata con l'eventuale re mattato in rosso. */
  finalFen: string;
  lastMove: { from: string; to: string } | null;
  /** Area dei bottoni (diversa tra modalità bot e amico). */
  children: React.ReactNode;
}

/**
 * Fine partita in stile chess.com: la scacchiera resta visibile con l'ultima
 * mossa evidenziata e — in caso di matto — il re sconfitto in rosso; la card
 * dell'esito "esplode" con una piccola animazione e la vittoria fa piovere
 * coriandoli.
 */
export function GameOverView({
  result,
  playerColor,
  finalFen,
  lastMove,
  children,
}: GameOverViewProps) {
  const outcome = playerOutcome(result, playerColor);
  const isCheckmate = result.reason === "checkmate";
  const matedColor: PieceColor = result.winner === "white" ? "b" : "w";
  const matedKing = isCheckmate ? kingSquare(finalFen, matedColor) : null;

  const title = isCheckmate
    ? outcome === "win"
      ? "Scacco matto!"
      : "Scacco matto…"
    : outcome === "win"
      ? "Hai vinto!"
      : outcome === "loss"
        ? "Hai perso"
        : "Patta";

  const emoji = outcome === "win" ? "🏆" : outcome === "draw" ? "🤝" : "😔";

  return (
    <div className="space-y-4">
      {outcome === "win" && <Confetti />}

      <Card className="animate-pop-in border-2 border-primary/30">
        <CardContent className="space-y-1 p-6 text-center">
          <div className="text-4xl" aria-hidden>
            {emoji}
          </div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            Partita conclusa per {reasonLabel(result.reason)}.
          </p>
        </CardContent>
      </Card>

      <BoardView
        fen={finalFen}
        orientation={playerColor === "w" ? "white" : "black"}
        draggable={false}
        lastMove={lastMove}
        dangerSquare={matedKing}
      />

      <div className="space-y-2">{children}</div>
    </div>
  );
}
