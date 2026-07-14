import { Chess, type Color, type PieceSymbol } from "chess.js";
import type { GameResultInfo, PieceColor } from "@/lib/types";

/** Valori materiali convenzionali (il re non ha valore materiale). */
export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export interface MaterialByColor {
  w: number;
  b: number;
}

/** Somma del valore dei pezzi per colore nella posizione data. */
export function materialByColor(chess: Chess): MaterialByColor {
  const totals: MaterialByColor = { w: 0, b: 0 };
  for (const row of chess.board()) {
    for (const square of row) {
      if (square) totals[square.color] += PIECE_VALUES[square.type];
    }
  }
  return totals;
}

/** Vantaggio materiale dal punto di vista di `color` (positivo = in vantaggio). */
export function materialAdvantage(chess: Chess, color: PieceColor): number {
  const totals = materialByColor(chess);
  return color === "w" ? totals.w - totals.b : totals.b - totals.w;
}

/**
 * Restituisce l'esito della partita se la posizione è terminale, altrimenti
 * `null`. Le condizioni di patta specifiche sono controllate prima di quella
 * generica per fornire una motivazione precisa.
 */
export function getResult(chess: Chess): GameResultInfo | null {
  if (chess.isCheckmate()) {
    // Il lato al tratto è sotto matto: vince l'altro.
    const winner = chess.turn() === "w" ? "black" : "white";
    return { winner, reason: "checkmate" };
  }
  if (chess.isStalemate()) return { winner: "draw", reason: "stalemate" };
  if (chess.isInsufficientMaterial()) return { winner: "draw", reason: "insufficient-material" };
  if (chess.isThreefoldRepetition()) return { winner: "draw", reason: "threefold-repetition" };
  if (chess.isDraw()) return { winner: "draw", reason: "fifty-move-rule" };
  return null;
}

/** Costruisce una mossa UCI a partire da una mossa verbose di chess.js. */
export function toUci(move: { from: string; to: string; promotion?: string }): string {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

export { Chess };
export type { Color, PieceSymbol };
