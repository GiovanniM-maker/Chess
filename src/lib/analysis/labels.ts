import type { IntentionValue, MomentType } from "@/lib/types";

export const MOMENT_TYPE_LABELS: Record<MomentType, string> = {
  "pezzo-perso": "Pezzo perso",
  "tattica-mancata": "Tattica mancata",
  "problema-sviluppo": "Problema di sviluppo",
  "re-esposto": "Re esposto",
  "occasione-mancata": "Occasione mancata",
};

export const INTENTION_LABELS: Record<IntentionValue, string> = {
  attaccare: "Attaccare",
  difendere: "Difendere",
  sviluppare: "Sviluppare un pezzo",
  catturare: "Catturare",
  "evitare-minaccia": "Evitare una minaccia",
  "non-lo-so": "Non lo so",
};

export const INTENTION_OPTIONS: IntentionValue[] = [
  "attaccare",
  "difendere",
  "sviluppare",
  "catturare",
  "evitare-minaccia",
  "non-lo-so",
];
