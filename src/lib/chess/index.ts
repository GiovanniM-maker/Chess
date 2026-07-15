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

/** Dotazione iniziale di pezzi per colore (il re non si cattura mai). */
const STARTING_COUNTS: Record<Exclude<PieceSymbol, "k">, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
};

export interface CapturedSummary {
  /** Pezzi neri catturati dal Bianco, in ordine di valore crescente. */
  byWhite: PieceSymbol[];
  /** Pezzi bianchi catturati dal Nero, in ordine di valore crescente. */
  byBlack: PieceSymbol[];
  /** Vantaggio materiale sul campo: positivo per il Bianco, negativo per il Nero. */
  whiteAdvantage: number;
}

/**
 * Pezzi catturati da ciascun lato, dedotti confrontando la posizione con la
 * dotazione iniziale (le promozioni possono ridurre il conteggio: mai sotto
 * zero). Il vantaggio è calcolato sul materiale realmente in campo.
 */
export function capturedPieces(fen: string): CapturedSummary {
  const chess = new Chess(fen);
  const counts: Record<PieceColor, Partial<Record<PieceSymbol, number>>> = { w: {}, b: {} };
  for (const row of chess.board()) {
    for (const square of row) {
      if (square && square.type !== "k") {
        counts[square.color][square.type] = (counts[square.color][square.type] ?? 0) + 1;
      }
    }
  }

  const missingFrom = (color: PieceColor): PieceSymbol[] => {
    const out: PieceSymbol[] = [];
    for (const type of Object.keys(STARTING_COUNTS) as Array<Exclude<PieceSymbol, "k">>) {
      const missing = Math.max(0, STARTING_COUNTS[type] - (counts[color][type] ?? 0));
      for (let i = 0; i < missing; i++) out.push(type);
    }
    return out;
  };

  const material = materialByColor(chess);
  return {
    byWhite: missingFrom("b"),
    byBlack: missingFrom("w"),
    whiteAdvantage: material.w - material.b,
  };
}

/** Una casa raggiungibile da un pezzo selezionato (per i "pallini" sulla scacchiera). */
export interface LegalTarget {
  to: string;
  isCapture: boolean;
}

/**
 * Case raggiungibili dal pezzo sulla casa indicata, con flag di cattura
 * (cattura normale o en passant). Vuoto se la casa non ha un pezzo del lato
 * al tratto. Usata dalla scacchiera per mostrare pallini/anelli stile
 * chess.com quando si seleziona un pezzo.
 */
export function legalTargets(fen: string, square: string): LegalTarget[] {
  const chess = new Chess(fen);
  return chess.moves({ square: square as never, verbose: true }).map((move) => ({
    to: move.to,
    isCapture: Boolean(move.captured),
  }));
}

/**
 * Ricostruisce la posizione dopo i primi `ply` semimosse di una partita.
 * Serve alla navigazione della cronologia: mostrare le posizioni passate
 * senza modificare la partita in corso.
 */
export function positionAtPly(
  sanMoves: string[],
  ply: number,
): { fen: string; lastMove: { from: string; to: string } | null } {
  const chess = new Chess();
  let lastMove: { from: string; to: string } | null = null;
  const upTo = Math.max(0, Math.min(ply, sanMoves.length));
  for (let i = 0; i < upTo; i++) {
    try {
      const move = chess.move(sanMoves[i]!);
      lastMove = { from: move.from, to: move.to };
    } catch {
      break; // storia non valida oltre questo punto: fermati alla posizione raggiunta
    }
  }
  return { fen: chess.fen(), lastMove };
}

export { Chess };
export type { Color, PieceSymbol };
