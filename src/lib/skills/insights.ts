import type { PieceColor, SavedGame } from "@/lib/types";
import { MOMENT_TYPE_LABELS } from "@/lib/analysis";
import { MOMENT_TO_SKILL } from "./profile";
import type { Confidence } from "./profile";

/**
 * Cognitive Engine — versione MVP (PRD §I.E): pochi insight, basati SOLO su
 * segnali osservabili, mostrati SOLO con evidenza sufficiente e con la
 * confidenza dichiarata. Nessun numero non supportato dai dati.
 */

export interface CognitiveInsight {
  id: string;
  text: string;
  confidence: Confidence;
  /** Quante osservazioni sostengono l'insight. */
  samples: number;
}

export interface LearningMemory {
  id: string;
  text: string;
}

/** La mossa al ply indicato è del giocatore? (ply 1-based; bianco = dispari). */
function isPlayerPly(ply: number, playerColor: PieceColor): boolean {
  return playerColor === "w" ? ply % 2 === 1 : ply % 2 === 0;
}

/**
 * Insight "velocità sotto pressione": confronta il tempo medio di riflessione
 * dopo una cattura avversaria con quello delle altre mosse. Segnale
 * osservabile (tempi registrati), niente inferenze non supportate.
 */
function speedUnderPressure(games: SavedGame[]): CognitiveInsight | null {
  const afterCapture: number[] = [];
  const normal: number[] = [];

  for (const game of games) {
    for (const move of game.moves) {
      if (move.thinkMs === undefined) continue;
      if (!isPlayerPly(move.ply, game.playerColor)) continue;
      const previous = game.moves.find((m) => m.ply === move.ply - 1);
      const opponentCaptured = previous ? previous.san.includes("x") : false;
      (opponentCaptured ? afterCapture : normal).push(move.thinkMs);
    }
  }

  const MIN_SAMPLES = 8;
  if (afterCapture.length < MIN_SAMPLES || normal.length < MIN_SAMPLES) return null;

  const avg = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
  const avgAfter = avg(afterCapture);
  const avgNormal = avg(normal);
  if (avgNormal <= 0) return null;

  const fasterPercent = Math.round((1 - avgAfter / avgNormal) * 100);
  // Sotto il 20% non è un pattern: non mostrare nulla (Principio 8).
  if (fasterPercent < 20) return null;

  const samples = afterCapture.length;
  return {
    id: "velocita-sotto-pressione",
    text: `Quando l'avversario cattura un pezzo, rispondi in media il ${fasterPercent}% più in fretta del solito. Prova a fermarti proprio lì: è il momento in cui nascono gli errori.`,
    confidence: samples >= 20 ? "media" : "bassa",
    samples,
  };
}

/** Insight "errore ricorrente": la categoria di errore più frequente. */
function recurringError(games: SavedGame[]): CognitiveInsight | null {
  const counts = new Map<string, number>();
  let analyzedGames = 0;
  for (const game of games) {
    if (!game.analysis) continue;
    analyzedGames += 1;
    for (const moment of game.analysis.moments) {
      counts.set(moment.type, (counts.get(moment.type) ?? 0) + 1);
    }
  }
  let topType: string | null = null;
  let topCount = 0;
  for (const [type, count] of counts) {
    if (count > topCount) {
      topType = type;
      topCount = count;
    }
  }
  const MIN_OCCURRENCES = 3;
  if (!topType || topCount < MIN_OCCURRENCES) return null;

  const label = MOMENT_TYPE_LABELS[topType as keyof typeof MOMENT_TYPE_LABELS].toLowerCase();
  return {
    id: "errore-ricorrente",
    text: `Il tuo errore più frequente è "${label}": ${topCount} volte nelle ultime ${analyzedGames} partite analizzate. È il primo pattern su cui lavorare.`,
    confidence: topCount >= 6 ? "media" : "bassa",
    samples: topCount,
  };
}

/** Tutti gli insight disponibili, solo quelli supportati dai dati. */
export function buildInsights(games: SavedGame[]): CognitiveInsight[] {
  return [speedUnderPressure(games), recurringError(games)].filter(
    (insight): insight is CognitiveInsight => insight !== null,
  );
}

/** Il giocatore ha arroccato entro la 10ª mossa in questa partita? */
function castledEarly(game: SavedGame): boolean {
  return game.moves.some(
    (move) =>
      isPlayerPly(move.ply, game.playerColor) && move.san.startsWith("O-O") && move.ply <= 20,
  );
}

/**
 * Memoria dell'apprendimento (PRD §I.F): confronti temporali reali, mostrati
 * solo quando il progresso c'è davvero (mai lodi vuote).
 */
export function buildMemories(games: SavedGame[]): LearningMemory[] {
  const memories: LearningMemory[] = [];
  const ordered = [...games].sort((a, b) => a.createdAt - b.createdAt);

  // 1) Pezzi in presa: il tasso per partita si è almeno dimezzato?
  const analyzed = ordered.filter((game) => game.analysis);
  if (analyzed.length >= 6) {
    const half = Math.floor(analyzed.length / 2);
    const rate = (slice: SavedGame[]) =>
      slice.reduce(
        (sum, game) =>
          sum +
          (game.analysis?.moments.filter((m) => MOMENT_TO_SKILL[m.type] === "pezzi-in-presa")
            .length ?? 0),
        0,
      ) / slice.length;
    const before = rate(analyzed.slice(0, half));
    const after = rate(analyzed.slice(analyzed.length - half));
    if (before >= 1 && after <= before / 2) {
      memories.push({
        id: "pezzi-in-presa-migliorati",
        text: `Un po' di tempo fa lasciavi pezzi in presa circa ${before.toFixed(1)} volte a partita. Nelle ultime ${half} partite: ${after.toFixed(1)}. Questo è un progresso vero.`,
      });
    }
  }

  // 2) Arrocco: prima saltuario, nelle ultime 5 partite sempre.
  if (ordered.length >= 8) {
    const recent = ordered.slice(-5);
    const earlier = ordered.slice(0, -5);
    const recentAll = recent.every(castledEarly);
    const earlierMissed = earlier.some((game) => !castledEarly(game));
    if (recentAll && earlierMissed) {
      memories.push({
        id: "arrocco-abitudine",
        text: "Prima non arroccavi sempre. Nelle ultime 5 partite hai arroccato ogni volta entro la decima mossa: è diventata un'abitudine.",
      });
    }
  }

  return memories;
}
