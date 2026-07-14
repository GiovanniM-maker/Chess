import { Chess } from "chess.js";
import type { MomentType, PieceColor } from "@/lib/types";
import { PIECE_VALUES } from "@/lib/chess";

export interface ClassifyInput {
  moveNumber: number;
  colorMoved: PieceColor;
  fenBefore: string;
  fenAfter: string;
  /** Mossa giocata dal giocatore, in UCI. */
  playedUci: string;
  /** Mossa migliore secondo il motore, in UCI. */
  bestUci: string;
  scoreBeforeCp: number;
  scoreAfterCp: number;
  centipawnLoss: number;
  /** Migliore risposta dell'avversario dopo la mossa giocata (UCI), se nota. */
  opponentBestUci: string | null;
}

interface ParsedUci {
  from: string;
  to: string;
  promotion?: string;
}

function parseUci(uci: string): ParsedUci | null {
  if (uci.length < 4) return null;
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci.slice(4, 5) : undefined;
  return promotion ? { from, to, promotion } : { from, to };
}

/** Se `uci` è una cattura nella posizione `fen`, restituisce il valore del pezzo catturato; altrimenti 0. */
function captureValue(fen: string, uci: string): number {
  const parsed = parseUci(uci);
  if (!parsed) return 0;
  const chess = new Chess(fen);
  const match = chess
    .moves({ verbose: true })
    .find((move) => move.from === parsed.from && move.to === parsed.to);
  if (!match || !match.captured) return 0;
  return PIECE_VALUES[match.captured];
}

function givesCheck(fen: string, uci: string): boolean {
  const parsed = parseUci(uci);
  if (!parsed) return false;
  const chess = new Chess(fen);
  try {
    chess.move({ from: parsed.from, to: parsed.to, promotion: parsed.promotion });
  } catch {
    return false;
  }
  return chess.inCheck();
}

function movedPiece(fen: string, uci: string): string | null {
  const parsed = parseUci(uci);
  if (!parsed) return null;
  const chess = new Chess(fen);
  const piece = chess.get(parsed.from as never);
  return piece ? piece.type : null;
}

/** Il re del colore indicato è ancora sulla casa di partenza (non arroccato/non mosso)? */
function kingOnStartSquare(fen: string, color: PieceColor): boolean {
  const chess = new Chess(fen);
  const startSquare = color === "w" ? "e1" : "e8";
  const piece = chess.get(startSquare as never);
  return piece?.type === "k" && piece.color === color;
}

/**
 * Classifica un momento in una delle 5 categorie educative previste dalla
 * Fase 1. Funzione PURA e deterministica: opera solo su FEN e mosse, senza
 * dipendere dal motore. L'ordine dei controlli è per priorità didattica.
 */
export function classifyMoment(input: ClassifyInput): MomentType {
  const played = parseUci(input.playedUci);
  const opponentCapture = input.opponentBestUci
    ? captureValue(input.fenAfter, input.opponentBestUci)
    : 0;
  const opponentTo = input.opponentBestUci ? input.opponentBestUci.slice(2, 4) : null;

  // 1) Pezzo perso: l'avversario cattura per profitto un pezzo (minore o più),
  //    in particolare proprio il pezzo appena mosso lasciato indifeso.
  const justMovedPieceIsCaptured = played !== null && opponentTo === played.to;
  if (opponentCapture >= 3 && (justMovedPieceIsCaptured || input.centipawnLoss >= 150)) {
    return "pezzo-perso";
  }

  // 2) Tattica mancata: esisteva una mossa forzante vincente (cattura o scacco)
  //    con vantaggio chiaro, e il giocatore ha giocato altro.
  const bestCapture = captureValue(input.fenBefore, input.bestUci);
  const bestIsCheck = givesCheck(input.fenBefore, input.bestUci);
  const playedIsBest = input.playedUci === input.bestUci;
  if (
    !playedIsBest &&
    (bestCapture >= 2 || bestIsCheck) &&
    input.scoreBeforeCp >= 150 &&
    input.centipawnLoss >= 120
  ) {
    return "tattica-mancata";
  }

  // 3) Problema di sviluppo: in apertura, mossa che trascura lo sviluppo
  //    (donna troppo presto, oppure mossa non di sviluppo con perdita di valutazione).
  const piece = movedPiece(input.fenBefore, input.playedUci);
  if (input.moveNumber <= 10 && input.centipawnLoss >= 80) {
    const earlyQueen = piece === "q" && input.moveNumber <= 6;
    const developingMinor = piece === "n" || piece === "b";
    if (earlyQueen || !developingMinor) {
      return "problema-sviluppo";
    }
  }

  // 4) Re esposto: re non ancora arroccato e mossa che ne peggiora la sicurezza.
  if (
    kingOnStartSquare(input.fenBefore, input.colorMoved) &&
    input.moveNumber >= 6 &&
    input.moveNumber <= 18 &&
    input.centipawnLoss >= 100
  ) {
    return "re-esposto";
  }

  // 5) Occasione mancata: esisteva una mossa nettamente migliore.
  return "occasione-mancata";
}
