import type { MomentType, SavedGame } from "@/lib/types";
import type { LessonProgress } from "@/lib/learn/types";
import type { SkillId } from "@/lib/learn/types";

/**
 * Skill profile SEMPLICE del MVP Core (PRD §19): niente percentuali fittizie,
 * solo stati interpretabili con confidenza legata al numero di osservazioni.
 * È derivato ogni volta dai dati reali (partite analizzate + lezioni), quindi
 * non può mai essere disallineato dallo storico.
 */

export type SkillStatus = "da-introdurre" | "in-apprendimento" | "stabile";
export type Confidence = "bassa" | "media" | "alta";
export type Trend = "miglioramento" | "stabile" | "peggioramento";

export interface ErrorRef {
  gameId: string;
  momentId: string;
  type: MomentType;
  createdAt: number;
}

export interface SkillState {
  id: SkillId;
  label: string;
  description: string;
  status: SkillStatus;
  confidence: Confidence;
  /** Numero totale di osservazioni (errori collegati + esercizi completati). */
  evidenceCount: number;
  trend: Trend | null;
  lastUpdated: number | null;
  /** Ultimi errori collegati (per mostrare "perché lo penso"). */
  recentErrors: ErrorRef[];
  /** Lezione consigliata (id), se esiste. */
  lessonId: string | null;
  lessonCompleted: boolean;
}

const SKILL_META: Record<SkillId, { label: string; description: string; lessonId: string | null }> =
  {
    "pezzi-in-presa": {
      label: "Attenzione ai pezzi in presa",
      description: "Non regalare pezzi e catturare quelli lasciati indifesi.",
      lessonId: "pezzi-in-presa",
    },
    tattiche: {
      label: "Tattiche immediate",
      description: "Vedere scacchi, catture e tattiche a una mossa.",
      lessonId: "ccm",
    },
    sviluppo: {
      label: "Sviluppo e apertura",
      description: "Portare i pezzi in gioco presto e verso il centro.",
      lessonId: "sviluppo",
    },
    "re-sicuro": {
      label: "Sicurezza del re",
      description: "Arroccare presto e non esporre il re.",
      lessonId: "re-sicuro",
    },
    finali: {
      label: "Finali e conversione del vantaggio",
      description: "Trasformare un vantaggio in vittoria.",
      lessonId: "matto-donna",
    },
  };

/** Mappa tipo di errore → competenza. */
export const MOMENT_TO_SKILL: Record<MomentType, SkillId> = {
  "pezzo-perso": "pezzi-in-presa",
  "tattica-mancata": "tattiche",
  "occasione-mancata": "tattiche",
  "problema-sviluppo": "sviluppo",
  "re-esposto": "re-sicuro",
};

const SKILL_IDS: SkillId[] = ["pezzi-in-presa", "tattiche", "sviluppo", "re-sicuro", "finali"];

function confidenceFor(evidenceCount: number): Confidence {
  if (evidenceCount < 3) return "bassa";
  if (evidenceCount < 8) return "media";
  return "alta";
}

/**
 * Trend: confronta il tasso di errori-per-partita tra la metà più vecchia e
 * quella più recente delle partite analizzate. Serve un minimo di dati (>=4
 * partite analizzate), altrimenti nessun trend (onestà statistica).
 */
function trendFor(analyzedGames: SavedGame[], skill: SkillId): Trend | null {
  if (analyzedGames.length < 4) return null;
  const half = Math.floor(analyzedGames.length / 2);
  const older = analyzedGames.slice(0, half);
  const newer = analyzedGames.slice(analyzedGames.length - half);
  const rate = (games: SavedGame[]) =>
    games.reduce(
      (sum, game) =>
        sum + (game.analysis?.moments.filter((m) => MOMENT_TO_SKILL[m.type] === skill).length ?? 0),
      0,
    ) / games.length;
  const before = rate(older);
  const after = rate(newer);
  if (after < before - 0.25) return "miglioramento";
  if (after > before + 0.25) return "peggioramento";
  return "stabile";
}

export function buildSkillProfile(
  games: SavedGame[],
  lessonProgress: LessonProgress[],
): SkillState[] {
  // Solo le partite analizzate producono evidenze; ordinate dalla più vecchia.
  const analyzed = games
    .filter((game) => (game.analysis?.moments.length ?? 0) >= 0 && game.analysis)
    .sort((a, b) => a.createdAt - b.createdAt);

  const progressByLesson = new Map(lessonProgress.map((p) => [p.lessonId, p]));

  return SKILL_IDS.map((skillId) => {
    const meta = SKILL_META[skillId];

    const errors: ErrorRef[] = analyzed.flatMap((game) =>
      (game.analysis?.moments ?? [])
        .filter((moment) => MOMENT_TO_SKILL[moment.type] === skillId)
        .map((moment) => ({
          gameId: game.id,
          momentId: moment.id,
          type: moment.type,
          createdAt: game.createdAt,
        })),
    );

    const progress = meta.lessonId ? progressByLesson.get(meta.lessonId) : undefined;
    const lessonCompleted = Boolean(progress?.completedAt);
    const exerciseEvidence = progress?.completedExercises.length ?? 0;
    const evidenceCount = errors.length + exerciseEvidence;

    const trend = trendFor(analyzed, skillId);
    // Stato: mai fingere precisione. "Stabile" solo se c'è la lezione completata
    // E il trend recente non mostra errori in crescita.
    let status: SkillStatus;
    if (evidenceCount === 0) {
      status = "da-introdurre";
    } else if (lessonCompleted && trend !== "peggioramento") {
      status = "stabile";
    } else {
      status = "in-apprendimento";
    }

    const lastUpdated =
      errors.length > 0 || progress
        ? Math.max(errors.at(-1)?.createdAt ?? 0, progress?.completedAt ?? 0) || null
        : null;

    return {
      id: skillId,
      label: meta.label,
      description: meta.description,
      status,
      confidence: confidenceFor(evidenceCount),
      evidenceCount,
      trend,
      lastUpdated,
      recentErrors: errors.slice(-5).reverse(),
      lessonId: meta.lessonId,
      lessonCompleted,
    };
  });
}
