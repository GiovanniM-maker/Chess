import type { MATE_SCORE } from "@/lib/types";

export interface EvaluateOptions {
  /** Profondità di ricerca (nodi UCI `go depth`). */
  depth: number;
  /** Numero di linee principali richieste (UCI MultiPV). Default 1. */
  multipv?: number;
}

/** Una singola linea principale restituita dal motore. */
export interface EngineLine {
  /** Indice MultiPV (1 = migliore). */
  rank: number;
  /** Prima mossa della linea, in notazione UCI (es. "e2e4"). */
  moveUci: string;
  /**
   * Punteggio in centipawn dal punto di vista del lato al tratto nella
   * posizione analizzata. Il matto è convertito nel valore `MATE_SCORE`
   * (con segno), vedi {@link MATE_SCORE}.
   */
  scoreCp: number;
  /** Numero di mosse al matto se presente (positivo = a favore del lato al tratto). */
  mate: number | null;
  /** Variante principale in notazione UCI. */
  pv: string[];
}

export interface EngineEvaluation {
  /** Migliore mossa (UCI) secondo il motore, o null se non disponibile. */
  bestMoveUci: string | null;
  /** Linee ordinate per `rank` crescente. */
  lines: EngineLine[];
  depth: number;
}

/**
 * Interfaccia del motore scacchistico. È implementata dall'adapter Stockfish
 * (browser) ma può essere sostituita da un fake nei test, così la logica di
 * bot e analisi resta verificabile senza WebAssembly.
 */
export interface ChessEngine {
  ready(): Promise<void>;
  evaluate(fen: string, opts: EvaluateOptions): Promise<EngineEvaluation>;
  dispose(): void;
}
