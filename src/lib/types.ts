/**
 * Tipi di dominio condivisi dell'intero prototipo.
 *
 * Convenzione sulle valutazioni: tutti i punteggi (`*Cp`) sono espressi in
 * centipawn dal punto di vista del giocatore che ha mosso in quel momento.
 * Il matto è codificato come un valore molto grande (vedi `MATE_SCORE`).
 */

export type PieceColor = "w" | "b";

/** Livello del bot, da 0 (quasi casuale) a 10 (massima forza del prototipo). */
export type BotLevelId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Vincitore logico di una partita conclusa. */
export type Winner = "white" | "black" | "draw";

export type GameEndReason =
  | "checkmate"
  | "stalemate"
  | "insufficient-material"
  | "threefold-repetition"
  | "fifty-move-rule"
  | "draw"
  | "resignation";

export interface GameResultInfo {
  winner: Winner;
  reason: GameEndReason;
}

/** Categorie proprietarie di errore (le sole 5 previste dalla Fase 1). */
export type MomentType =
  "pezzo-perso" | "tattica-mancata" | "problema-sviluppo" | "re-esposto" | "occasione-mancata";

/** Intenzione dichiarata dal giocatore su un momento chiave. */
export type IntentionValue =
  "attaccare" | "difendere" | "sviluppare" | "catturare" | "evitare-minaccia" | "non-lo-so";

export interface StoredMove {
  ply: number;
  san: string;
  fenAfter: string;
}

/** Una mossa alternativa suggerita dal motore, con la linea che ne segue. */
export interface MomentAlternative {
  san: string;
  uci: string;
  /** Valutazione della linea, lato giocatore che muove. */
  scoreCp: number;
  /** Prime mosse della variante in SAN, esplorabili passo passo. */
  lineSan: string[];
}

/** Un singolo "momento educativo" selezionato dall'analisi. */
export interface AnalysisMoment {
  /** Identificatore stabile all'interno della partita (basato sul ply). */
  id: string;
  ply: number;
  moveNumber: number;
  colorMoved: PieceColor;
  fenBefore: string;
  fenAfter: string;
  playedSan: string;
  playedUci: string;
  bestSan: string;
  bestUci: string;
  /** Valutazione della posizione prima della mossa (miglior gioco), lato mover. */
  scoreBeforeCp: number;
  /** Valutazione dopo la mossa effettivamente giocata, lato mover. */
  scoreAfterCp: number;
  /** Perdita in centipawn causata dalla mossa (>= 0). */
  centipawnLoss: number;
  type: MomentType;
  /** Le migliori alternative del motore (MultiPV), assenti nei salvataggi più vecchi. */
  alternatives?: MomentAlternative[];
}

export interface GameAnalysis {
  generatedAt: number;
  moments: AnalysisMoment[];
}

/** Modalità di gioco di una partita salvata. I salvataggi storici (senza campo) sono "bot". */
export type GameMode = "bot" | "friend";

export interface SavedGame {
  id: string;
  createdAt: number;
  mode?: GameMode;
  playerColor: PieceColor;
  /** Presente solo per le partite contro il bot. */
  botLevel?: BotLevelId;
  result: GameResultInfo;
  pgn: string;
  finalFen: string;
  moves: StoredMove[];
  analysis?: GameAnalysis;
  /** Mappa momentId -> intenzione dichiarata. */
  intentions?: Record<string, IntentionValue>;
}

/** Valore convenzionale che rappresenta il matto in centipawn. */
export const MATE_SCORE = 100_000;
