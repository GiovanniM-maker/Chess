"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteReviewItems, listGames, listReviewItems, putReviewItems } from "@/lib/storage";
import {
  dueItems,
  harvestReviewItems,
  nextDueAt,
  pruneItems,
  reviewResult,
  todaySet,
  type ReviewItem,
} from "./items";

export interface WarmupState {
  loading: boolean;
  /** Gli esercizi di oggi, fissati al caricamento (non cambiano a metà sessione). */
  today: ReviewItem[];
  /** Quanti esercizi sono scaduti in totale (per il badge in home). */
  dueCount: number;
  /** Prossima scadenza futura (per il messaggio "torna domani"). */
  nextDue: number | null;
  /** C'è almeno una partita analizzata da cui raccogliere esercizi? */
  hasAnalyzedGames: boolean;
  /** Registra l'esito di un esercizio e riprogramma il ripasso. */
  record: (item: ReviewItem, correct: boolean) => Promise<void>;
}

/**
 * Carica la coda di ripasso, raccoglie i nuovi errori dalle partite analizzate
 * e prepara il riscaldamento di oggi. La raccolta è idempotente: gli id degli
 * esercizi derivano da partita+momento, quindi niente duplicati.
 */
export function useWarmup(): WarmupState {
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [today, setToday] = useState<ReviewItem[]>([]);
  const [hasAnalyzedGames, setHasAnalyzedGames] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([listGames(), listReviewItems()]).then(async ([games, stored]) => {
      const now = Date.now();
      const fresh = harvestReviewItems(games, stored, now);
      const { keep, dropIds } = pruneItems([...stored, ...fresh]);
      await Promise.all([putReviewItems(fresh), deleteReviewItems(dropIds)]);
      if (!active) return;
      setItems(keep);
      setToday(todaySet(keep, now));
      setHasAnalyzedGames(games.some((game) => game.analysis));
    });
    return () => {
      active = false;
    };
  }, []);

  const record = useCallback(async (item: ReviewItem, correct: boolean) => {
    const updated = reviewResult(item, correct, Date.now());
    await putReviewItems([updated]);
    setItems((current) =>
      current ? current.map((entry) => (entry.id === updated.id ? updated : entry)) : current,
    );
  }, []);

  const now = Date.now();
  return {
    loading: items === null,
    today,
    dueCount: items ? dueItems(items, now).length : 0,
    nextDue: items ? nextDueAt(items, now) : null,
    hasAnalyzedGames,
    record,
  };
}
