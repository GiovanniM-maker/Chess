import { describe, expect, it } from "vitest";
import type { AnalysisMoment, MomentType, SavedGame } from "@/lib/types";
import { buildSkillProfile } from "./profile";
import { buildInsights, buildMemories } from "./insights";

let counter = 0;

function moment(type: MomentType): AnalysisMoment {
  counter += 1;
  return {
    id: `ply-${counter}`,
    ply: counter,
    moveNumber: Math.ceil(counter / 2),
    colorMoved: "w",
    fenBefore: "fb",
    fenAfter: "fa",
    playedSan: "a3",
    playedUci: "a2a3",
    bestSan: "e4",
    bestUci: "e2e4",
    scoreBeforeCp: 100,
    scoreAfterCp: -100,
    centipawnLoss: 200,
    type,
  };
}

function game(types: MomentType[], overrides: Partial<SavedGame> = {}): SavedGame {
  counter += 1;
  return {
    id: `g-${counter}`,
    createdAt: counter * 1000,
    mode: "bot",
    playerColor: "w",
    botLevel: 2,
    result: { winner: "white", reason: "checkmate" },
    pgn: "",
    finalFen: "f",
    moves: [],
    analysis: { generatedAt: 0, moments: types.map(moment) },
    ...overrides,
  };
}

describe("skill profile semplice (Core)", () => {
  it("senza dati: tutte le competenze sono 'da introdurre'", () => {
    const skills = buildSkillProfile([], []);
    expect(skills).toHaveLength(5);
    expect(skills.every((skill) => skill.status === "da-introdurre")).toBe(true);
    expect(skills.every((skill) => skill.confidence === "bassa")).toBe(true);
  });

  it("gli errori alimentano la competenza giusta", () => {
    const skills = buildSkillProfile([game(["pezzo-perso", "pezzo-perso", "re-esposto"])], []);
    const inPresa = skills.find((skill) => skill.id === "pezzi-in-presa")!;
    const re = skills.find((skill) => skill.id === "re-sicuro")!;
    const finali = skills.find((skill) => skill.id === "finali")!;
    expect(inPresa.evidenceCount).toBe(2);
    expect(inPresa.status).toBe("in-apprendimento");
    expect(re.evidenceCount).toBe(1);
    expect(finali.status).toBe("da-introdurre");
  });

  it("la confidenza cresce con le osservazioni, senza percentuali", () => {
    const many = Array.from({ length: 4 }, () => game(["tattica-mancata", "occasione-mancata"]));
    const skills = buildSkillProfile(many, []);
    const tattiche = skills.find((skill) => skill.id === "tattiche")!;
    expect(tattiche.evidenceCount).toBe(8);
    expect(tattiche.confidence).toBe("alta");
  });

  it("lezione completata + trend non negativo = 'stabile'", () => {
    const games = [game(["pezzo-perso", "pezzo-perso"]), game(["pezzo-perso"]), game([]), game([])];
    const skills = buildSkillProfile(games, [
      { lessonId: "pezzi-in-presa", completedExercises: ["a", "b", "c"], completedAt: 999 },
    ]);
    const inPresa = skills.find((skill) => skill.id === "pezzi-in-presa")!;
    expect(inPresa.status).toBe("stabile");
    expect(inPresa.trend).toBe("miglioramento");
  });
});

describe("cognitive insights: mostrati solo con evidenza sufficiente", () => {
  it("nessun insight senza dati", () => {
    expect(buildInsights([])).toEqual([]);
    expect(buildMemories([])).toEqual([]);
  });

  it("l'errore ricorrente emerge con almeno 3 occorrenze", () => {
    const games = [game(["pezzo-perso", "pezzo-perso"]), game(["pezzo-perso"])];
    const insights = buildInsights(games);
    const recurring = insights.find((insight) => insight.id === "errore-ricorrente");
    expect(recurring).toBeDefined();
    expect(recurring?.samples).toBe(3);
    expect(recurring?.text).toContain("pezzo perso");
  });

  it("2 sole occorrenze non bastano (onestà statistica)", () => {
    const games = [game(["pezzo-perso", "pezzo-perso"])];
    const insights = buildInsights(games);
    expect(insights.find((insight) => insight.id === "errore-ricorrente")).toBeUndefined();
  });

  it("la memoria del progresso appare solo se il miglioramento è reale", () => {
    // 3 partite vecchie piene di pezzi persi, 3 recenti pulite.
    const games = [
      game(["pezzo-perso", "pezzo-perso"]),
      game(["pezzo-perso", "pezzo-perso"]),
      game(["pezzo-perso"]),
      game([]),
      game([]),
      game([]),
    ];
    const memories = buildMemories(games);
    expect(memories.find((memory) => memory.id === "pezzi-in-presa-migliorati")).toBeDefined();
  });
});
