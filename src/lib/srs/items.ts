import type { AnalysisMoment, MomentType, PieceColor, SavedGame } from "@/lib/types";

/**
 * Riscaldamento (ripasso spaziato): gli esercizi NON sono inventati, nascono
 * dalle posizioni in cui il giocatore ha davvero sbagliato nelle sue partite
 * analizzate. Un errore "sparisce" dalla coda solo risolvendolo più volte a
 * distanza crescente di tempo (scatole di Leitner) — è la definizione
 * operativa di "lezione imparata" del Mastery Loop.
 */
export interface ReviewItem {
  /** `${gameId}:${momentId}` — stabile, evita duplicati tra raccolte. */
  id: string;
  gameId: string;
  momentId: string;
  createdAt: number;
  /** Posizione PRIMA dell'errore: tocca al giocatore rifare la scelta. */
  fen: string;
  playerColor: PieceColor;
  /** Mosse accettate come corrette (migliore + alternative quasi pari). */
  solutions: string[];
  bestSan: string;
  bestUci: string;
  /** La mossa giocata in partita, mostrata DOPO il tentativo. */
  playedSan: string;
  type: MomentType;
  /** Scatola di Leitner: 0 = appena raccolto/sbagliato, 5 = consolidato. */
  box: number;
  dueAt: number;
  reviews: number;
  successes: number;
}

export const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_BOX = 5;
/** Giorni di attesa dopo un successo, indicizzati per scatola raggiunta (1..5). */
export const BOX_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;
/** Un'alternativa del motore entro questa perdita (cp) vale come soluzione. */
const SOLUTION_TOLERANCE_CP = 50;
/** Tetto alla coda di ripasso: oltre, si scartano gli esercizi più vecchi. */
export const MAX_ITEMS = 60;
export const DAILY_SET_SIZE = 5;

function solutionsFor(moment: AnalysisMoment): string[] {
  const nearBest = (moment.alternatives ?? [])
    .filter((alt) => moment.scoreBeforeCp - alt.scoreCp <= SOLUTION_TOLERANCE_CP)
    .map((alt) => alt.san);
  return [...new Set([moment.bestSan, ...nearBest])];
}

/**
 * Raccoglie i nuovi esercizi dalle partite analizzate (solo errori del
 * giocatore, mai del bot). Ritorna SOLO gli elementi non ancora in coda.
 */
export function harvestReviewItems(
  games: SavedGame[],
  existing: ReviewItem[],
  now: number,
): ReviewItem[] {
  const known = new Set(existing.map((item) => item.id));
  const fresh: ReviewItem[] = [];
  for (const game of games) {
    if (!game.analysis) continue;
    for (const moment of game.analysis.moments) {
      if (moment.colorMoved !== game.playerColor) continue;
      const id = `${game.id}:${moment.id}`;
      if (known.has(id)) continue;
      known.add(id);
      fresh.push({
        id,
        gameId: game.id,
        momentId: moment.id,
        createdAt: now,
        fen: moment.fenBefore,
        playerColor: moment.colorMoved,
        solutions: solutionsFor(moment),
        bestSan: moment.bestSan,
        bestUci: moment.bestUci,
        playedSan: moment.playedSan,
        type: moment.type,
        box: 0,
        dueAt: now,
        reviews: 0,
        successes: 0,
      });
    }
  }
  return fresh;
}

/**
 * Applica l'esito di un ripasso: successo → scatola successiva e attesa più
 * lunga; errore → si riparte dalla scatola 0 e lo si rivede domani (la
 * soluzione viene mostrata subito, l'apprendimento avviene ora).
 */
export function reviewResult(item: ReviewItem, correct: boolean, now: number): ReviewItem {
  if (!correct) {
    return { ...item, box: 0, dueAt: now + DAY_MS, reviews: item.reviews + 1 };
  }
  const box = Math.min(item.box + 1, MAX_BOX);
  const days = BOX_INTERVAL_DAYS[box - 1] ?? 30;
  return {
    ...item,
    box,
    dueAt: now + days * DAY_MS,
    reviews: item.reviews + 1,
    successes: item.successes + 1,
  };
}

/** Esercizi scaduti, dal più urgente (in attesa da più tempo). */
export function dueItems(items: ReviewItem[], now: number): ReviewItem[] {
  return items
    .filter((item) => item.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt || a.createdAt - b.createdAt);
}

/** Il riscaldamento di oggi: al massimo {@link DAILY_SET_SIZE} esercizi. */
export function todaySet(items: ReviewItem[], now: number): ReviewItem[] {
  return dueItems(items, now).slice(0, DAILY_SET_SIZE);
}

/** Prossima scadenza futura, o null se non c'è nulla in arrivo. */
export function nextDueAt(items: ReviewItem[], now: number): number | null {
  const future = items.filter((item) => item.dueAt > now).map((item) => item.dueAt);
  return future.length > 0 ? Math.min(...future) : null;
}

/** Mantiene la coda entro {@link MAX_ITEMS}, scartando i più vecchi. */
export function pruneItems(items: ReviewItem[]): { keep: ReviewItem[]; dropIds: string[] } {
  if (items.length <= MAX_ITEMS) return { keep: items, dropIds: [] };
  const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
  return {
    keep: sorted.slice(0, MAX_ITEMS),
    dropIds: sorted.slice(MAX_ITEMS).map((item) => item.id),
  };
}
