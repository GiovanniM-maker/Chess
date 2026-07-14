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
   * "Temperatura" della scelta: alta = più casuale (più umano-debole),
   * bassa = quasi sempre la mossa migliore. Espressa in centipawn.
   */
  temperature: number;
}

/**
 * I tre livelli del prototipo. La forza NON è ottenuta solo abbassando la
 * profondità (che darebbe bot "forti ma sabotati"), ma combinando profondità
 * ridotta con una scelta probabilistica tra più mosse candidate: così un
 * livello basso a volte non gioca la mossa migliore, in modo simile a un
 * principiante. I parametri sono volutamente semplici e verranno calibrati
 * in una fase successiva (vedi PRD §13).
 */
export const BOT_LEVELS: Record<BotLevelId, BotLevelConfig> = {
  "beginner-absolute": {
    id: "beginner-absolute",
    label: "Principiante Assoluto",
    description: "Ha appena imparato le regole. Gioca spesso mosse casuali.",
    depth: 4,
    multipv: 4,
    temperature: 500,
  },
  beginner: {
    id: "beginner",
    label: "Principiante",
    description: "Riconosce le catture evidenti ma commette errori frequenti.",
    depth: 7,
    multipv: 3,
    temperature: 200,
  },
  amateur: {
    id: "amateur",
    label: "Amatoriale",
    description: "Gioca in modo ragionevole e punisce gli errori più gravi.",
    depth: 11,
    multipv: 2,
    temperature: 60,
  },
};

export const BOT_LEVEL_LIST: BotLevelConfig[] = [
  BOT_LEVELS["beginner-absolute"],
  BOT_LEVELS["beginner"],
  BOT_LEVELS["amateur"],
];
