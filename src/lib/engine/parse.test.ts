import { describe, expect, it } from "vitest";
import { MATE_SCORE } from "@/lib/types";
import { mateToCp, parseInfoLine } from "./parse";

describe("parsing dell'output UCI di Stockfish", () => {
  it("interpreta una riga info con punteggio in centipawn", () => {
    const parsed = parseInfoLine(
      "info depth 12 seldepth 15 multipv 1 score cp 34 nodes 1000 pv e2e4 e7e5 g1f3",
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.rank).toBe(1);
    expect(parsed?.scoreCp).toBe(34);
    expect(parsed?.moveUci).toBe("e2e4");
    expect(parsed?.pv).toEqual(["e2e4", "e7e5", "g1f3"]);
  });

  it("interpreta il matto e lo converte in centipawn convenzionali", () => {
    const parsed = parseInfoLine("info depth 10 multipv 2 score mate 3 pv d1h5 g8f6");
    expect(parsed?.rank).toBe(2);
    expect(parsed?.mate).toBe(3);
    expect(parsed?.scoreCp).toBe(MATE_SCORE - 3);
  });

  it("ignora righe senza variante principale", () => {
    expect(parseInfoLine("info depth 1 score cp 10")).toBeNull();
    expect(parseInfoLine("bestmove e2e4")).toBeNull();
  });

  it("mateToCp assegna il segno corretto", () => {
    expect(mateToCp(2)).toBe(MATE_SCORE - 2);
    expect(mateToCp(-2)).toBe(-(MATE_SCORE - 2));
  });
});
