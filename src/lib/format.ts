import { MATE_SCORE, type GameEndReason, type GameResultInfo, type PieceColor } from "@/lib/types";

const REASON_LABELS: Record<GameEndReason, string> = {
  checkmate: "scacco matto",
  stalemate: "stallo",
  "insufficient-material": "materiale insufficiente",
  "threefold-repetition": "ripetizione",
  "fifty-move-rule": "regola delle 50 mosse",
  draw: "patta",
  resignation: "abbandono",
};

/** Esito della partita dal punto di vista del giocatore. */
export function playerOutcome(
  result: GameResultInfo,
  playerColor: PieceColor,
): "win" | "loss" | "draw" {
  if (result.winner === "draw") return "draw";
  const playerIsWhite = playerColor === "w";
  const playerWon = (result.winner === "white") === playerIsWhite;
  return playerWon ? "win" : "loss";
}

export function outcomeTitle(outcome: "win" | "loss" | "draw"): string {
  if (outcome === "win") return "Hai vinto!";
  if (outcome === "loss") return "Hai perso";
  return "Patta";
}

export function reasonLabel(reason: GameEndReason): string {
  return REASON_LABELS[reason];
}

/**
 * Converte un punteggio in centipawn in una stringa leggibile, dal punto di
 * vista indicato. Il matto è mostrato come "M±n".
 */
export function formatEval(cp: number): string {
  if (Math.abs(cp) >= MATE_SCORE - 1000) {
    const movesToMate = MATE_SCORE - Math.abs(cp);
    return `M${cp > 0 ? "" : "-"}${movesToMate}`;
  }
  const pawns = cp / 100;
  const sign = pawns > 0 ? "+" : "";
  return `${sign}${pawns.toFixed(1)}`;
}

/** Formatta un timestamp come data locale breve. */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
