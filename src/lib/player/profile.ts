import type { BotLevelId } from "@/lib/types";
import { toBotLevelId } from "@/lib/bot";

/**
 * Il "Rivale": la spina dorsale della progressione (PEDAGOGIA §6-bis).
 * L'utente non sceglie mai un livello: una breve calibrazione gli assegna un
 * Rivale personale, e battendolo con costanza lo fa salire di livello.
 * Battere bot sempre più forti è miglioramento oggettivo: la gamification e
 * l'apprendimento coincidono.
 */

export type GameOutcome = "win" | "loss" | "draw";

export interface ActiveMission {
  missionId: string;
  /** Lezione che ha attivato la missione (se proviene da una lezione). */
  lessonId?: string;
}

export interface PlayerProfile {
  id: "player";
  /** Livello del Rivale; null = calibrazione non ancora completata. */
  rivalLevel: BotLevelId | null;
  /** Livello corrente proposto durante la calibrazione. */
  calibrationLevel: BotLevelId;
  /** Partite di calibrazione già giocate. */
  calibrationGames: number;
  /** Esiti recenti contro il Rivale (finestra scorrevole, max 5). */
  recentResults: GameOutcome[];
  /** Massimo livello DOMINATO (da cui si è stati promossi). -1 = nessuno. */
  dominatedLevel: number;
  /** Missione comportamentale attiva per la prossima partita. */
  activeMission: ActiveMission | null;
  updatedAt: number;
}

export const CALIBRATION_TOTAL_GAMES = 3;
const CALIBRATION_START_LEVEL: BotLevelId = 3;
const PROMOTION_WINDOW = 5;
const PROMOTION_WINS = 3;
const DEMOTION_LOSSES = 4;

export function defaultPlayerProfile(): PlayerProfile {
  return {
    id: "player",
    rivalLevel: null,
    calibrationLevel: CALIBRATION_START_LEVEL,
    calibrationGames: 0,
    recentResults: [],
    dominatedLevel: -1,
    activeMission: null,
    updatedAt: 0,
  };
}

/** Evento di progressione da mostrare all'utente dopo una partita. */
export type ProgressionEvent =
  | { type: "calibration-step"; gamesPlayed: number; totalGames: number; nextLevel: BotLevelId }
  | { type: "calibrated"; rivalLevel: BotLevelId }
  | { type: "promotion"; newLevel: BotLevelId; dominatedLevel: number }
  | { type: "demotion"; newLevel: BotLevelId };

/**
 * Registra l'esito di una partita "ufficiale" (calibrazione o Rivale) e
 * restituisce il profilo aggiornato + l'eventuale evento da celebrare.
 * Funzione PURA: lo storage è responsabilità del chiamante.
 *
 * Calibrazione (3 partite, si parte dal livello 3): vittoria +2, patta +1,
 * sconfitta -1. Alla terza partita il livello raggiunto diventa il Rivale.
 *
 * Rivale: finestra degli ultimi 5 esiti; 3 vittorie → promozione (il vecchio
 * livello diventa "dominato"); 4 sconfitte → il Rivale scende di uno (mai
 * sotto 0), così la sfida resta alla portata.
 */
export function recordResult(
  profile: PlayerProfile,
  outcome: GameOutcome,
  now: number,
): { profile: PlayerProfile; event: ProgressionEvent } {
  if (profile.rivalLevel === null) {
    const delta = outcome === "win" ? 2 : outcome === "draw" ? 1 : -1;
    const nextLevel = toBotLevelId(profile.calibrationLevel + delta);
    const gamesPlayed = profile.calibrationGames + 1;

    if (gamesPlayed >= CALIBRATION_TOTAL_GAMES) {
      return {
        profile: {
          ...profile,
          rivalLevel: nextLevel,
          calibrationLevel: nextLevel,
          calibrationGames: gamesPlayed,
          recentResults: [],
          updatedAt: now,
        },
        event: { type: "calibrated", rivalLevel: nextLevel },
      };
    }
    return {
      profile: {
        ...profile,
        calibrationLevel: nextLevel,
        calibrationGames: gamesPlayed,
        updatedAt: now,
      },
      event: {
        type: "calibration-step",
        gamesPlayed,
        totalGames: CALIBRATION_TOTAL_GAMES,
        nextLevel,
      },
    };
  }

  const recentResults = [...profile.recentResults, outcome].slice(-PROMOTION_WINDOW);
  const wins = recentResults.filter((r) => r === "win").length;
  const losses = recentResults.filter((r) => r === "loss").length;

  if (wins >= PROMOTION_WINS && profile.rivalLevel < 10) {
    const dominatedLevel = Math.max(profile.dominatedLevel, profile.rivalLevel);
    const newLevel = toBotLevelId(profile.rivalLevel + 1);
    return {
      profile: {
        ...profile,
        rivalLevel: newLevel,
        dominatedLevel,
        recentResults: [],
        updatedAt: now,
      },
      event: { type: "promotion", newLevel, dominatedLevel },
    };
  }

  if (losses >= DEMOTION_LOSSES && profile.rivalLevel > 0) {
    const newLevel = toBotLevelId(profile.rivalLevel - 1);
    return {
      profile: { ...profile, rivalLevel: newLevel, recentResults: [], updatedAt: now },
      event: { type: "demotion", newLevel },
    };
  }

  // Caso limite: 3 vittorie al livello 10 — non si sale oltre, ma il 10
  // diventa dominato (grado massimo).
  if (wins >= PROMOTION_WINS && profile.rivalLevel === 10 && profile.dominatedLevel < 10) {
    return {
      profile: { ...profile, dominatedLevel: 10, recentResults: [], updatedAt: now },
      event: { type: "promotion", newLevel: 10, dominatedLevel: 10 },
    };
  }

  return {
    profile: { ...profile, recentResults, updatedAt: now },
    event: {
      type: "calibration-step", // mai usato: placeholder impossibile
      gamesPlayed: 0,
      totalGames: 0,
      nextLevel: profile.rivalLevel,
    },
  };
}

/**
 * Variante di recordResult che ritorna evento null quando non c'è nulla da
 * celebrare (partita normale contro il Rivale senza promozione/retrocessione).
 */
export function applyGameOutcome(
  profile: PlayerProfile,
  outcome: GameOutcome,
  now: number,
): { profile: PlayerProfile; event: ProgressionEvent | null } {
  const before = profile;
  const result = recordResult(profile, outcome, now);
  // recordResult usa un placeholder quando non succede nulla: normalizzalo.
  const nothingHappened =
    before.rivalLevel !== null &&
    result.event.type === "calibration-step" &&
    result.event.totalGames === 0;
  return { profile: result.profile, event: nothingHappened ? null : result.event };
}

/** Gradi a tema scacchistico, basati sul livello di Rivale DOMINATO (mai sul volume). */
export interface Grade {
  id: string;
  label: string;
  glyph: string;
}

const GRADES: { min: number; grade: Grade }[] = [
  { min: 10, grade: { id: "re", label: "Re", glyph: "♚" } },
  { min: 8, grade: { id: "donna", label: "Donna", glyph: "♛" } },
  { min: 6, grade: { id: "torre", label: "Torre", glyph: "♜" } },
  { min: 4, grade: { id: "alfiere", label: "Alfiere", glyph: "♝" } },
  { min: 2, grade: { id: "cavaliere", label: "Cavaliere", glyph: "♞" } },
  { min: 0, grade: { id: "pedone", label: "Pedone", glyph: "♟" } },
];

export function gradeFor(dominatedLevel: number): Grade {
  for (const entry of GRADES) {
    if (dominatedLevel >= entry.min) return entry.grade;
  }
  return { id: "esordiente", label: "Esordiente", glyph: "•" };
}
