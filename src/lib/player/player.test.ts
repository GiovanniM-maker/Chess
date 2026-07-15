import { describe, expect, it } from "vitest";
import type { AnalysisMoment, MomentType, SavedGame } from "@/lib/types";
import { applyGameOutcome, defaultPlayerProfile, gradeFor, type PlayerProfile } from "./profile";
import { evaluateMission, missionForLesson, missionForSkill, suggestMission } from "./missions";

function afterOutcomes(start: PlayerProfile, outcomes: ("win" | "loss" | "draw")[]) {
  let profile = start;
  let lastEvent = null as ReturnType<typeof applyGameOutcome>["event"];
  for (const outcome of outcomes) {
    const result = applyGameOutcome(profile, outcome, 1000);
    profile = result.profile;
    lastEvent = result.event;
  }
  return { profile, lastEvent };
}

describe("calibrazione (trova il tuo livello)", () => {
  it("parte dal livello 3 e si adatta: vittoria +2, sconfitta -1", () => {
    const { profile, lastEvent } = afterOutcomes(defaultPlayerProfile(), ["win", "loss", "win"]);
    // 3 → 5 → 4 → 6: dopo 3 partite il Rivale è assegnato.
    expect(profile.rivalLevel).toBe(6);
    expect(lastEvent).toEqual({ type: "calibrated", rivalLevel: 6 });
  });

  it("non scende mai sotto lo 0 né sopra il 10", () => {
    const down = afterOutcomes(defaultPlayerProfile(), ["loss", "loss", "loss"]);
    expect(down.profile.rivalLevel).toBe(0);
    const up = afterOutcomes(defaultPlayerProfile(), ["win", "win", "win"]);
    expect(up.profile.rivalLevel).toBe(9);
  });

  it("le prime partite emettono l'evento di avanzamento calibrazione", () => {
    const first = applyGameOutcome(defaultPlayerProfile(), "win", 1000);
    expect(first.event).toEqual({
      type: "calibration-step",
      gamesPlayed: 1,
      totalGames: 3,
      nextLevel: 5,
    });
  });
});

describe("il Rivale: promozione e retrocessione", () => {
  const calibrated: PlayerProfile = {
    ...defaultPlayerProfile(),
    rivalLevel: 4,
    calibrationGames: 3,
  };

  it("3 vittorie nelle ultime 5 → promozione e livello dominato", () => {
    const { profile, lastEvent } = afterOutcomes(calibrated, ["win", "loss", "win", "win"]);
    expect(lastEvent).toEqual({ type: "promotion", newLevel: 5, dominatedLevel: 4 });
    expect(profile.rivalLevel).toBe(5);
    expect(profile.dominatedLevel).toBe(4);
    expect(profile.recentResults).toEqual([]);
  });

  it("4 sconfitte nelle ultime 5 → il Rivale scende di uno", () => {
    const { profile, lastEvent } = afterOutcomes(calibrated, [
      "loss",
      "loss",
      "win",
      "loss",
      "loss",
    ]);
    expect(lastEvent).toEqual({ type: "demotion", newLevel: 3 });
    expect(profile.rivalLevel).toBe(3);
  });

  it("una partita qualunque non emette eventi", () => {
    const { lastEvent } = afterOutcomes(calibrated, ["win"]);
    expect(lastEvent).toBeNull();
  });

  it("il grado deriva dal livello dominato, mai dal volume", () => {
    expect(gradeFor(-1).id).toBe("esordiente");
    expect(gradeFor(0).id).toBe("pedone");
    expect(gradeFor(3).id).toBe("cavaliere");
    expect(gradeFor(5).id).toBe("alfiere");
    expect(gradeFor(7).id).toBe("torre");
    expect(gradeFor(9).id).toBe("donna");
    expect(gradeFor(10).id).toBe("re");
  });
});

// ── Missioni ────────────────────────────────────────────────────────────────

let counter = 0;
function moment(type: MomentType): AnalysisMoment {
  counter += 1;
  return {
    id: `ply-${counter}`,
    ply: counter,
    moveNumber: 1,
    colorMoved: "w",
    fenBefore: "fb",
    fenAfter: "fa",
    playedSan: "a3",
    playedUci: "a2a3",
    bestSan: "e4",
    bestUci: "e2e4",
    scoreBeforeCp: 0,
    scoreAfterCp: 0,
    centipawnLoss: 200,
    type,
  };
}

const win = { winner: "white", reason: "checkmate" } as const;
const longGame = Array.from({ length: 30 }, (_, i) => (i === 8 ? "O-O" : "a3"));

describe("missioni verificate dai dati", () => {
  it("arrocco entro la decima: successo, fallimento e non-valutabile", () => {
    const def = missionForSkill("re-sicuro");
    expect(
      evaluateMission(def, { sanMoves: longGame, playerColor: "w", result: win, moments: null }),
    ).toBe("success");
    expect(
      evaluateMission(def, {
        sanMoves: Array.from({ length: 30 }, () => "a3"),
        playerColor: "w",
        result: win,
        moments: null,
      }),
    ).toBe("fail");
    expect(
      evaluateMission(def, {
        sanMoves: ["e4", "e5"],
        playerColor: "w",
        result: win,
        moments: null,
      }),
    ).toBe("na");
  });

  it("niente pezzi in presa: dipende dalla review", () => {
    const def = missionForSkill("pezzi-in-presa");
    const base = { sanMoves: longGame, playerColor: "w" as const, result: win };
    expect(evaluateMission(def, { ...base, moments: null })).toBe("na");
    expect(evaluateMission(def, { ...base, moments: [] })).toBe("success");
    expect(evaluateMission(def, { ...base, moments: [moment("pezzo-perso")] })).toBe("fail");
    expect(evaluateMission(def, { ...base, moments: [moment("re-esposto")] })).toBe("success");
  });

  it("vinci per scacco matto: n/a se non vinci", () => {
    const def = missionForSkill("finali");
    const base = { sanMoves: longGame, playerColor: "w" as const, moments: null };
    expect(evaluateMission(def, { ...base, result: win })).toBe("success");
    expect(
      evaluateMission(def, { ...base, result: { winner: "white", reason: "resignation" } }),
    ).toBe("fail");
    expect(
      evaluateMission(def, { ...base, result: { winner: "black", reason: "checkmate" } }),
    ).toBe("na");
  });

  it("il completamento di una lezione attiva la missione della sua competenza", () => {
    expect(missionForLesson("re-sicuro")?.id).toBe("m-arrocco");
    expect(missionForLesson("pezzi-in-presa")?.id).toBe("m-pezzi-in-presa");
    expect(missionForLesson("apertura-italiana")?.id).toBe("m-sviluppo");
  });

  it("la missione suggerita attacca la debolezza più frequente", () => {
    const games = [
      {
        id: "g1",
        createdAt: 1,
        playerColor: "w",
        result: win,
        pgn: "",
        finalFen: "",
        moves: [],
        analysis: { generatedAt: 0, moments: [moment("pezzo-perso"), moment("pezzo-perso")] },
      },
    ] as unknown as SavedGame[];
    expect(suggestMission(games).id).toBe("m-pezzi-in-presa");
    expect(suggestMission([]).id).toBe("m-arrocco");
  });
});
