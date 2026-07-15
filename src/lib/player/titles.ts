import type { MomentType, SavedGame } from "@/lib/types";
import { isPlayerPly } from "@/lib/chess";

/**
 * Titoli e streak comportamentali (PEDAGOGIA §6-bis: il reward premia il
 * COMPORTAMENTO, mai il volume). Tutto è DERIVATO dalle partite reali: non
 * esiste un contatore separato da gonfiare. Un titolo si conquista solo
 * ripetendo davvero una buona abitudine per N partite di fila — la stessa
 * definizione operativa di "abitudine acquisita" del Mastery Loop.
 *
 * Le abitudini verificabili solo con l'analisi (niente pezzi in presa, ...)
 * contano SOLO sulle partite analizzate: un comportamento non verificato non
 * fa punteggio, né in positivo né in negativo.
 */

export type HabitId = "no-hang" | "castle-early" | "sharp-eye" | "clean-opening";

export interface Title {
  id: string;
  label: string;
  glyph: string;
  /** Requisito in chiaro (es. "3 partite di fila senza pezzi in presa"). */
  requirement: string;
}

interface HabitDef {
  id: HabitId;
  label: string;
  /** Cosa misura la streak, per l'etichetta (es. "partite senza pezzi in presa"). */
  streakNoun: string;
  /** La partita può verificare questa abitudine? (altrimenti è "non valutabile") */
  applicable: (game: SavedGame) => boolean;
  /** La partita soddisfa l'abitudine? */
  satisfied: (game: SavedGame) => boolean;
  titles: { threshold: number; title: Title }[];
}

function isAnalyzed(game: SavedGame): boolean {
  return game.analysis !== undefined;
}

/** Nessun momento della categoria data tra gli errori del giocatore. */
function withoutMoment(game: SavedGame, type: MomentType): boolean {
  return !(game.analysis?.moments ?? []).some(
    (moment) => moment.type === type && moment.colorMoved === game.playerColor,
  );
}

/** Il giocatore ha arroccato entro la decima mossa (ply <= 20)? */
function castledEarly(game: SavedGame): boolean {
  return game.moves.some(
    (move) =>
      isPlayerPly(move.ply, game.playerColor) && move.san.startsWith("O-O") && move.ply <= 20,
  );
}

/** La partita è arrivata almeno alla decima mossa? (altrimenti l'arrocco è "na") */
function reachedMoveTen(game: SavedGame): boolean {
  return game.moves.length >= 20;
}

const HABITS: HabitDef[] = [
  {
    id: "no-hang",
    label: "Niente pezzi in presa",
    streakNoun: "partite senza regalare un pezzo",
    applicable: isAnalyzed,
    satisfied: (game) => withoutMoment(game, "pezzo-perso"),
    titles: [
      {
        threshold: 3,
        title: {
          id: "presa-sicura",
          label: "Presa sicura",
          glyph: "🛡️",
          requirement: "3 partite analizzate di fila senza lasciare un pezzo in presa",
        },
      },
      {
        threshold: 6,
        title: {
          id: "muraglia",
          label: "Muraglia",
          glyph: "🧱",
          requirement: "6 partite analizzate di fila senza lasciare un pezzo in presa",
        },
      },
    ],
  },
  {
    id: "castle-early",
    label: "Re al sicuro presto",
    streakNoun: "partite con arrocco entro la decima",
    applicable: (game) => reachedMoveTen(game) || castledEarly(game),
    satisfied: castledEarly,
    titles: [
      {
        threshold: 3,
        title: {
          id: "re-prudente",
          label: "Re prudente",
          glyph: "🏰",
          requirement: "3 partite di fila con arrocco entro la decima mossa",
        },
      },
      {
        threshold: 8,
        title: {
          id: "fortezza",
          label: "Fortezza",
          glyph: "🏯",
          requirement: "8 partite di fila con arrocco entro la decima mossa",
        },
      },
    ],
  },
  {
    id: "sharp-eye",
    label: "Occhio alle tattiche",
    streakNoun: "partite senza tattiche mancate",
    applicable: isAnalyzed,
    satisfied: (game) => withoutMoment(game, "tattica-mancata"),
    titles: [
      {
        threshold: 3,
        title: {
          id: "occhio-vivo",
          label: "Occhio vivo",
          glyph: "👁️",
          requirement: "3 partite analizzate di fila senza lasciarti sfuggire una tattica",
        },
      },
      {
        threshold: 6,
        title: {
          id: "falco",
          label: "Falco",
          glyph: "🦅",
          requirement: "6 partite analizzate di fila senza lasciarti sfuggire una tattica",
        },
      },
    ],
  },
  {
    id: "clean-opening",
    label: "Sviluppo ordinato",
    streakNoun: "partite con apertura pulita",
    applicable: isAnalyzed,
    satisfied: (game) => withoutMoment(game, "problema-sviluppo"),
    titles: [
      {
        threshold: 3,
        title: {
          id: "apertura-ordinata",
          label: "Apertura ordinata",
          glyph: "📖",
          requirement: "3 partite analizzate di fila senza problemi di sviluppo",
        },
      },
      {
        threshold: 6,
        title: {
          id: "teoria-solida",
          label: "Teoria solida",
          glyph: "📚",
          requirement: "6 partite analizzate di fila senza problemi di sviluppo",
        },
      },
    ],
  },
];

export interface EarnedTitle extends Title {
  habit: HabitId;
}

export interface HabitProgress {
  id: HabitId;
  label: string;
  streakNoun: string;
  /** Streak attuale: partite consecutive (fino all'ultima valutabile) soddisfatte. */
  current: number;
  /** Streak record mai raggiunta (da cui derivano i titoli conquistati). */
  best: number;
  /** Partite che hanno potuto verificare l'abitudine. */
  applicableGames: number;
  earnedTitles: Title[];
  /** Prossimo titolo da sbloccare e quante partite mancano alla streak attuale. */
  nextTitle: { title: Title; remaining: number } | null;
}

/**
 * Streak su una sequenza di partite (dalla più vecchia alla più recente):
 * le partite non valutabili vengono saltate (non spezzano la serie), perché
 * una partita che non ha potuto testare l'abitudine non è un fallimento.
 */
function streaks(games: SavedGame[], habit: HabitDef): { current: number; best: number } {
  const sequence = games.filter(habit.applicable).map(habit.satisfied);
  let best = 0;
  let run = 0;
  for (const ok of sequence) {
    run = ok ? run + 1 : 0;
    if (run > best) best = run;
  }
  let current = 0;
  for (let index = sequence.length - 1; index >= 0 && sequence[index]; index -= 1) {
    current += 1;
  }
  return { current, best };
}

/** Progresso di tutte le abitudini, ordinato per streak attuale decrescente. */
export function buildHabits(games: SavedGame[]): HabitProgress[] {
  const ordered = [...games].sort((a, b) => a.createdAt - b.createdAt);
  return HABITS.map((habit) => {
    const { current, best } = streaks(ordered, habit);
    const earnedTitles = habit.titles
      .filter((entry) => best >= entry.threshold)
      .map((entry) => entry.title);
    const upcoming = habit.titles.find((entry) => current < entry.threshold);
    return {
      id: habit.id,
      label: habit.label,
      streakNoun: habit.streakNoun,
      current,
      best,
      applicableGames: ordered.filter(habit.applicable).length,
      earnedTitles,
      nextTitle: upcoming
        ? { title: upcoming.title, remaining: upcoming.threshold - current }
        : null,
    };
  }).sort((a, b) => b.current - a.current);
}

/** Tutti i titoli conquistati (per la bacheca), con l'abitudine di provenienza. */
export function earnedTitles(games: SavedGame[]): EarnedTitle[] {
  const ordered = [...games].sort((a, b) => a.createdAt - b.createdAt);
  const result: EarnedTitle[] = [];
  for (const habit of HABITS) {
    const { best } = streaks(ordered, habit);
    for (const entry of habit.titles) {
      if (best >= entry.threshold) result.push({ ...entry.title, habit: habit.id });
    }
  }
  return result;
}

/** Tutti i titoli esistenti (per mostrare anche quelli ancora da sbloccare). */
export function allTitles(): EarnedTitle[] {
  return HABITS.flatMap((habit) =>
    habit.titles.map((entry) => ({ ...entry.title, habit: habit.id })),
  );
}
