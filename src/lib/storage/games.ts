import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { GameAnalysis, IntentionValue, SavedGame } from "@/lib/types";
import type { LessonProgress } from "@/lib/learn/types";
import { defaultPlayerProfile, type PlayerProfile } from "@/lib/player/profile";
import type { ReviewItem } from "@/lib/srs/items";

interface PensaDB extends DBSchema {
  games: {
    key: string;
    value: SavedGame;
    indexes: { "by-createdAt": number };
  };
  lessons: {
    key: string;
    value: LessonProgress;
  };
  player: {
    key: string;
    value: PlayerProfile;
  };
  srs: {
    key: string;
    value: ReviewItem;
  };
}

const DB_NAME = "pensa-proto";
const DB_VERSION = 4;
const STORE = "games";
const LESSONS_STORE = "lessons";
const PLAYER_STORE = "player";
const SRS_STORE = "srs";

let dbPromise: Promise<IDBPDatabase<PensaDB>> | null = null;

function getDb(): Promise<IDBPDatabase<PensaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PensaDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("by-createdAt", "createdAt");
        }
        if (oldVersion < 2) {
          db.createObjectStore(LESSONS_STORE, { keyPath: "lessonId" });
        }
        if (oldVersion < 3) {
          db.createObjectStore(PLAYER_STORE, { keyPath: "id" });
        }
        if (oldVersion < 4) {
          db.createObjectStore(SRS_STORE, { keyPath: "id" });
        }
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

/** Registra se una spiegazione è stata utile (raccolta feedback del Core). */
export async function updateGameFeedback(
  id: string,
  momentId: string,
  value: "up" | "down",
): Promise<void> {
  const db = await getDb();
  const game = await db.get(STORE, id);
  if (!game) return;
  const explanationFeedback = { ...(game.explanationFeedback ?? {}), [momentId]: value };
  await db.put(STORE, { ...game, explanationFeedback });
}

/** Avanzamento di una lezione (undefined se mai iniziata). */
export async function getLessonProgress(lessonId: string): Promise<LessonProgress | undefined> {
  const db = await getDb();
  return db.get(LESSONS_STORE, lessonId);
}

export async function listLessonProgress(): Promise<LessonProgress[]> {
  const db = await getDb();
  return db.getAll(LESSONS_STORE);
}

/**
 * Segna un esercizio come risolto; quando tutti gli esercizi della lezione
 * sono risolti, registra il completamento.
 */
export async function markExerciseDone(
  lessonId: string,
  exerciseId: string,
  totalExercises: number,
): Promise<LessonProgress> {
  const db = await getDb();
  const current = (await db.get(LESSONS_STORE, lessonId)) ?? {
    lessonId,
    completedExercises: [],
    completedAt: null,
  };
  const completedExercises = current.completedExercises.includes(exerciseId)
    ? current.completedExercises
    : [...current.completedExercises, exerciseId];
  const completedAt =
    current.completedAt ?? (completedExercises.length >= totalExercises ? Date.now() : null);
  const next: LessonProgress = { lessonId, completedExercises, completedAt };
  await db.put(LESSONS_STORE, next);
  return next;
}

/** Profilo giocatore (Rivale, calibrazione, missione attiva). */
export async function getPlayerProfile(): Promise<PlayerProfile> {
  const db = await getDb();
  return (await db.get(PLAYER_STORE, "player")) ?? defaultPlayerProfile();
}

export async function savePlayerProfile(profile: PlayerProfile): Promise<void> {
  const db = await getDb();
  await db.put(PLAYER_STORE, profile);
}

/** Attiva una missione (es. al completamento di una lezione). */
export async function setActiveMission(missionId: string, lessonId?: string): Promise<void> {
  const profile = await getPlayerProfile();
  await savePlayerProfile({
    ...profile,
    activeMission: lessonId ? { missionId, lessonId } : { missionId },
    updatedAt: Date.now(),
  });
}

/** Coda del riscaldamento (ripasso spaziato degli errori reali). */
export async function listReviewItems(): Promise<ReviewItem[]> {
  const db = await getDb();
  return db.getAll(SRS_STORE);
}

/** Inserisce o aggiorna più esercizi di ripasso in una sola transazione. */
export async function putReviewItems(items: ReviewItem[]): Promise<void> {
  if (items.length === 0) return;
  const db = await getDb();
  const tx = db.transaction(SRS_STORE, "readwrite");
  await Promise.all(items.map((item) => tx.store.put(item)));
  await tx.done;
}

export async function deleteReviewItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const tx = db.transaction(SRS_STORE, "readwrite");
  await Promise.all(ids.map((id) => tx.store.delete(id)));
  await tx.done;
}

/** Solo per i test: azzera il database in memoria. */
export async function _clearAllGamesForTests(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE);
  await db.clear(LESSONS_STORE);
  await db.clear(PLAYER_STORE);
  await db.clear(SRS_STORE);
}
