import type { BotLevelId } from "@/lib/types";

export interface BotLevelConfig {
  id: BotLevelId;
  label: string;
  description: string;
  /** Profondità di ricerca del motore per generare le mosse candidate. */
  depth: number;
  /** Numero di mosse candidate (MultiPV) tra cui scegliere. */
  multipv: number;
  /**
   * "Temperatura" della scelta softmax, in centipawn: alta = più casuale,
   * bassa = quasi sempre la mossa migliore.
   */
  temperature: number;
  /**
   * Probabilità di giocare una mossa legale del tutto casuale, ignorando il
   * motore. È ciò che rende davvero deboli i livelli bassi.
   */
  randomMoveChance: number;
}

/**
 * Gli 11 livelli (0–10) del bot.
 *
 * Lezione appresa dalle critiche ai bot di chess.com ("motore a piena forza +
 * errori casuali": giocano perfetti e poi regalano la donna in modo assurdo):
 * un livello basso deve essere COSTANTEMENTE debole, non forte-con-regali.
 * Perciò la debolezza combina tre leve coerenti tra loro:
 * - profondità bassissima (non "vede" le tattiche, come un principiante);
 * - scelta probabilistica tra più candidate (temperatura alta = mosse mediocri);
 * - una quota di mosse legali casuali ai livelli più bassi.
 * I parametri restano una calibrazione preliminare, da tarare su partite reali.
 */
export const BOT_LEVELS: Record<BotLevelId, BotLevelConfig> = {
  0: {
    id: 0,
    label: "Casuale",
    description: "Muove quasi a caso: perfetto se hai appena imparato come si muovono i pezzi.",
    depth: 1,
    multipv: 8,
    temperature: 1000,
    randomMoveChance: 0.85,
  },
  1: {
    id: 1,
    label: "Distratto",
    description: "Vede solo le catture più evidenti e regala spesso i suoi pezzi.",
    depth: 1,
    multipv: 6,
    temperature: 500,
    randomMoveChance: 0.5,
  },
  2: {
    id: 2,
    label: "Alle prime armi",
    description: "Nota le minacce immediate, ma lascia pezzi in presa di frequente.",
    depth: 2,
    multipv: 6,
    temperature: 350,
    randomMoveChance: 0.3,
  },
  3: {
    id: 3,
    label: "Principiante",
    description: "Sviluppa i pezzi ma commette errori frequenti.",
    depth: 3,
    multipv: 5,
    temperature: 250,
    randomMoveChance: 0.15,
  },
  4: {
    id: 4,
    label: "Apprendista",
    description: "Riconosce le tattiche semplici e sbaglia un po' meno.",
    depth: 5,
    multipv: 4,
    temperature: 180,
    randomMoveChance: 0.07,
  },
  5: {
    id: 5,
    label: "Amatoriale",
    description: "Un giocatore amatoriale equilibrato.",
    depth: 6,
    multipv: 4,
    temperature: 130,
    randomMoveChance: 0.03,
  },
  6: {
    id: 6,
    label: "Attento",
    description: "Punisce gli errori evidenti: attento ai pezzi in presa.",
    depth: 8,
    multipv: 3,
    temperature: 90,
    randomMoveChance: 0,
  },
  7: {
    id: 7,
    label: "Stratega",
    description: "Costruisce piani semplici e sbaglia raramente.",
    depth: 10,
    multipv: 3,
    temperature: 60,
    randomMoveChance: 0,
  },
  8: {
    id: 8,
    label: "Giocatore di circolo",
    description: "Solido e preciso, non perdona le distrazioni.",
    depth: 12,
    multipv: 2,
    temperature: 35,
    randomMoveChance: 0,
  },
  9: {
    id: 9,
    label: "Maestro",
    description: "Molto preciso: quasi mai un errore.",
    depth: 14,
    multipv: 2,
    temperature: 15,
    randomMoveChance: 0,
  },
  10: {
    id: 10,
    label: "Motore",
    description: "Gioca sempre la mossa che ritiene migliore.",
    depth: 16,
    multipv: 1,
    temperature: 1,
    randomMoveChance: 0,
  },
};

export const BOT_LEVEL_LIST: BotLevelConfig[] = Array.from(
  { length: 11 },
  (_, index) => BOT_LEVELS[index as BotLevelId],
);

/** Converte un numero qualsiasi (es. dallo slider) in un livello valido. */
export function toBotLevelId(value: number): BotLevelId {
  const clamped = Math.min(10, Math.max(0, Math.round(value)));
  return clamped as BotLevelId;
}

/** Id usati dalle partite salvate prima del passaggio ai livelli numerici. */
const LEGACY_LEVEL_IDS: Record<string, BotLevelId> = {
  "beginner-absolute": 0,
  beginner: 2,
  amateur: 5,
};

/**
 * Risolve un livello letto dallo storage (numerico, legacy testuale o
 * sconosciuto) in una configurazione valida. Le partite salvate con i vecchi
 * id testuali restano così leggibili.
 */
export function resolveBotLevel(value: unknown): BotLevelConfig {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10) {
    return BOT_LEVELS[value as BotLevelId];
  }
  if (typeof value === "string" && value in LEGACY_LEVEL_IDS) {
    return BOT_LEVELS[LEGACY_LEVEL_IDS[value]!];
  }
  return BOT_LEVELS[2];
}
