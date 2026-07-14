import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { GameAnalysis, IntentionValue, SavedGame } from "@/lib/types";

interface PensaDB extends DBSchema {
  games: {
    key: string;
    value: SavedGame;
    indexes: { "by-createdAt": number };
  };
}

const DB_NAME = "pensa-proto";
const DB_VERSION = 1;
const STORE = "games";

let dbPromise: Promise<IDBPDatabase<PensaDB>> | null = null;

function getDb(): Promise<IDBPDatabase<PensaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PensaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("by-createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}

/** Genera un identificatore univoco per una partita. */
export function createGameId(): string {
  return crypto.randomUUID();
}

export async function saveGame(game: SavedGame): Promise<void> {
  const db = await getDb();
  await db.put(STORE, game);
}

export async function getGame(id: string): Promise<SavedGame | undefined> {
  const db = await getDb();
  return db.get(STORE, id);
}

/** Elenco delle partite, dalla più recente alla più vecchia. */
export async function listGames(): Promise<SavedGame[]> {
  const db = await getDb();
  const games = await db.getAllFromIndex(STORE, "by-createdAt");
  return games.reverse();
}

export async function deleteGame(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}

/** Aggiorna l'analisi salvata di una partita esistente. */
export async function updateGameAnalysis(id: string, analysis: GameAnalysis): Promise<void> {
  const db = await getDb();
  const game = await db.get(STORE, id);
  if (!game) return;
  await db.put(STORE, { ...game, analysis });
}

/** Aggiorna l'intenzione dichiarata per un singolo momento. */
export async function updateGameIntention(
  id: string,
  momentId: string,
  intention: IntentionValue,
): Promise<void> {
  const db = await getDb();
  const game = await db.get(STORE, id);
  if (!game) return;
  const intentions = { ...(game.intentions ?? {}), [momentId]: intention };
  await db.put(STORE, { ...game, intentions });
}

/** Solo per i test: azzera il database in memoria. */
export async function _clearAllGamesForTests(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE);
}
