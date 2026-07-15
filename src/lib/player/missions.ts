import type { AnalysisMoment, GameResultInfo, PieceColor, SavedGame } from "@/lib/types";
import type { SkillId } from "@/lib/learn/types";
import { getLesson } from "@/lib/learn/lessons";
import { isPlayerPly } from "@/lib/chess";
import { playerOutcome } from "@/lib/format";
import { MOMENT_TO_SKILL } from "@/lib/skills";

/**
 * Missioni del Mastery Loop: UNA azione comportamentale per la prossima
 * partita, VERIFICATA automaticamente dai dati (mosse o review). Mai un
 * compito autodichiarato: o la review lo conferma, o non conta.
 */

export type MissionCheck =
  "castle-early" | "no-pezzo-perso" | "no-tattica-mancata" | "no-problema-sviluppo" | "mate-win";

export interface MissionDef {
  id: string;
  skill: SkillId;
  /** Testo mostrato prima/durante la partita. */
  text: string;
  /** Feedback alla riuscita. */
  successText: string;
  check: MissionCheck;
}

export const MISSIONS: MissionDef[] = [
  {
    id: "m-pezzi-in-presa",
    skill: "pezzi-in-presa",
    text: "Non lasciare nessun pezzo in presa",
    successText: "Nessun pezzo regalato per tutta la partita: missione compiuta!",
    check: "no-pezzo-perso",
  },
  {
    id: "m-ccm",
    skill: "tattiche",
    text: "Prima di ogni mossa: scacchi, catture, minacce",
    successText: "Nessuna tattica ti è sfuggita: la checklist funziona!",
    check: "no-tattica-mancata",
  },
  {
    id: "m-sviluppo",
    skill: "sviluppo",
    text: "In apertura, sviluppa un pezzo nuovo a ogni mossa",
    successText: "Apertura pulita, sviluppo perfetto: missione compiuta!",
    check: "no-problema-sviluppo",
  },
  {
    id: "m-arrocco",
    skill: "re-sicuro",
    text: "Arrocca entro la decima mossa",
    successText: "Re al sicuro entro la decima: missione compiuta!",
    check: "castle-early",
  },
  {
    id: "m-matto",
    skill: "finali",
    text: "Se vinci, chiudi la partita con scacco matto",
    successText: "Vittoria per scacco matto: il finale non ti fa più paura!",
    check: "mate-win",
  },
];

export function getMission(id: string): MissionDef | undefined {
  return MISSIONS.find((mission) => mission.id === id);
}

export function missionForSkill(skill: SkillId): MissionDef {
  return MISSIONS.find((mission) => mission.skill === skill) ?? MISSIONS[3]!;
}

/** Missione attivata dal completamento di una lezione (via skill della lezione). */
export function missionForLesson(lessonId: string): MissionDef | undefined {
  const lesson = getLesson(lessonId);
  return lesson ? missionForSkill(lesson.skill) : undefined;
}

/** Il giocatore ha arroccato entro la decima mossa? */
function castledEarly(sanMoves: string[], playerColor: PieceColor): boolean {
  return sanMoves.some(
    (san, index) => isPlayerPly(index + 1, playerColor) && san.startsWith("O-O") && index + 1 <= 20,
  );
}

export type MissionOutcome = "success" | "fail" | "na";

export interface MissionContext {
  sanMoves: string[];
  playerColor: PieceColor;
  result: GameResultInfo;
  /** Momenti della review; null se la partita non è (ancora) analizzata. */
  moments: AnalysisMoment[] | null;
}

/**
 * Verifica deterministica della missione sulla partita giocata.
 * "na" = non valutabile (es. partita troppo corta, analisi assente, oppure
 * la condizione non si applica): non è né successo né fallimento.
 */
export function evaluateMission(def: MissionDef, ctx: MissionContext): MissionOutcome {
  switch (def.check) {
    case "castle-early": {
      if (castledEarly(ctx.sanMoves, ctx.playerColor)) return "success";
      // Partita finita prima della decima mossa: non è colpa di nessuno.
      return ctx.sanMoves.length < 20 ? "na" : "fail";
    }
    case "no-pezzo-perso":
    case "no-tattica-mancata":
    case "no-problema-sviluppo": {
      if (!ctx.moments) return "na";
      const target = def.check.replace("no-", "") as AnalysisMoment["type"];
      return ctx.moments.some((moment) => moment.type === target) ? "fail" : "success";
    }
    case "mate-win": {
      if (playerOutcome(ctx.result, ctx.playerColor) !== "win") return "na";
      return ctx.result.reason === "checkmate" ? "success" : "fail";
    }
  }
}

/**
 * Missione suggerita quando nessuna lezione ne ha attivata una: attacca la
 * debolezza più frequente nelle partite analizzate (>= 2 evidenze),
 * altrimenti l'arrocco (utile a chiunque e verificabile senza analisi).
 */
export function suggestMission(games: SavedGame[]): MissionDef {
  const counts = new Map<SkillId, number>();
  for (const game of games) {
    for (const moment of game.analysis?.moments ?? []) {
      const skill = MOMENT_TO_SKILL[moment.type];
      counts.set(skill, (counts.get(skill) ?? 0) + 1);
    }
  }
  let top: SkillId | null = null;
  let topCount = 0;
  for (const [skill, count] of counts) {
    if (count > topCount) {
      top = skill;
      topCount = count;
    }
  }
  if (top && topCount >= 2) return missionForSkill(top);
  return missionForSkill("re-sicuro");
}
