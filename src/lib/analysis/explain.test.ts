import { describe, expect, it } from "vitest";
import type { AnalysisMoment } from "@/lib/types";
import { buildExplanation, countWords } from "./explain";

const moment: AnalysisMoment = {
  id: "ply-7",
  ply: 7,
  moveNumber: 4,
  colorMoved: "w",
  fenBefore: "startpos",
  fenAfter: "afterpos",
  playedSan: "Bc4",
  playedUci: "f1c4",
  bestSan: "Nf3",
  bestUci: "g1f3",
  scoreBeforeCp: 40,
  scoreAfterCp: -160,
  centipawnLoss: 200,
  type: "pezzo-perso",
};

describe("generazione deterministica delle spiegazioni", () => {
  it("non supera le 120 parole", () => {
    for (const intention of ["attaccare", "non-lo-so", undefined] as const) {
      const text = buildExplanation(moment, intention);
      expect(countWords(text)).toBeLessThanOrEqual(120);
    }
  });

  it("cita sempre la mossa migliore", () => {
    expect(buildExplanation(moment, "attaccare")).toContain("Nf3");
  });

  it("personalizza in base all'intenzione dichiarata", () => {
    const attack = buildExplanation(moment, "attaccare");
    const defend = buildExplanation(moment, "difendere");
    expect(attack).not.toBe(defend);
    expect(attack.toLowerCase()).toContain("attaccare");
  });

  it("termina con un'azione concreta per la prossima volta", () => {
    expect(buildExplanation(moment, "catturare")).toContain("prossima volta");
  });
});
