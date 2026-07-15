import type { MomentAlternative, MomentType, PieceColor } from "@/lib/types";

/** Valutazione completa di una singola mossa del giocatore. */
export interface MoveEvaluation {
  ply: number;
  moveNumber: number;
  colorMoved: PieceColor;
  fenBefore: string;
  fenAfter: string;
  playedSan: string;
  playedUci: string;
  bestSan: string;
  bestUci: string;
  scoreBeforeCp: number;
  scoreAfterCp: number;
  centipawnLoss: number;
  opponentBestUci: string | null;
  /** Migliori alternative del motore nella posizione prima della mossa. */
  alternatives: MomentAlternative[];
}

/** Soglia minima di perdita (in centipawn) perché una mossa sia considerata un errore istruttivo. */
export const MIN_INSTRUCTIVE_CPL = 80;

/**
 * Seleziona i momenti più istruttivi tra le mosse valutate. Funzione PURA.
 *
 * Regole:
 * - si considerano solo le mosse con perdita >= {@link MIN_INSTRUCTIVE_CPL};
 * - si escludono le mosse che coincidono con la migliore (nessun errore);
 * - si ordina per perdita decrescente e si prendono al massimo `limit`;
 * - a parità di perdita, vince la mossa più avanti nella partita (tie-break
 *   deterministico), così l'output è stabile.
 */
export function selectMoments(evaluations: MoveEvaluation[], limit = 3): MoveEvaluation[] {
  return evaluations
    .filter(
      (evaluation) =>
        evaluation.centipawnLoss >= MIN_INSTRUCTIVE_CPL &&
        evaluation.playedUci !== evaluation.bestUci,
    )
    .sort((a, b) => b.centipawnLoss - a.centipawnLoss || b.ply - a.ply)
    .slice(0, limit);
}

export type { MomentType };
