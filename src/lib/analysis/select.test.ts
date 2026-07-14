import { describe, expect, it } from "vitest";
import { selectMoments, type MoveEvaluation } from "./select";

function evaluation(overrides: Partial<MoveEvaluation> & { ply: number }): MoveEvaluation {
  return {
    moveNumber: Math.ceil(overrides.ply / 2),
    colorMoved: "w",
    fenBefore: "startpos",
    fenAfter: "afterpos",
    playedSan: "x",
    playedUci: "a1a2",
    bestSan: "y",
    bestUci: "b1b2",
    scoreBeforeCp: 0,
    scoreAfterCp: 0,
    centipawnLoss: 0,
    opponentBestUci: null,
    ...overrides,
  };
}

describe("selezione dei momenti educativi", () => {
  it("prende al massimo i 3 errori con perdita maggiore", () => {
    const evaluations = [
      evaluation({ ply: 1, centipawnLoss: 500 }),
      evaluation({ ply: 3, centipawnLoss: 50 }), // sotto soglia
      evaluation({ ply: 5, centipawnLoss: 300 }),
      evaluation({ ply: 7, centipawnLoss: 200 }),
      evaluation({ ply: 9, centipawnLoss: 150 }),
    ];
    const moments = selectMoments(evaluations);
    expect(moments.map((m) => m.ply)).toEqual([1, 5, 7]);
  });

  it("esclude le mosse che coincidono con la migliore", () => {
    const evaluations = [
      evaluation({ ply: 1, centipawnLoss: 400, playedUci: "e2e4", bestUci: "e2e4" }),
      evaluation({ ply: 3, centipawnLoss: 120 }),
    ];
    const moments = selectMoments(evaluations);
    expect(moments.map((m) => m.ply)).toEqual([3]);
  });

  it("restituisce lista vuota se non ci sono errori sopra soglia", () => {
    const evaluations = [evaluation({ ply: 1, centipawnLoss: 10 })];
    expect(selectMoments(evaluations)).toHaveLength(0);
  });
});
