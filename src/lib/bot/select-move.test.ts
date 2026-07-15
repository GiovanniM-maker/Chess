import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import type { EngineLine } from "@/lib/engine";
import { BOT_LEVELS } from "./levels";
import { selectBotMove } from "./select-move";
import { createRng } from "./rng";

function line(rank: number, moveUci: string, scoreCp: number): EngineLine {
  return { rank, moveUci, scoreCp, mate: null, pv: [moveUci] };
}

/** Trova la prima mossa legale della posizione, in UCI (per i test di legalità). */
function firstLegalUci(fen: string): string {
  const move = new Chess(fen).moves({ verbose: true })[0]!;
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

describe("selezione della mossa del bot", () => {
  it("restituisce sempre una delle mosse candidate", () => {
    const lines = [line(1, "e2e4", 30), line(2, "d2d4", 20), line(3, "g1f3", 10)];
    const rng = createRng(42);
    for (let i = 0; i < 50; i++) {
      const chosen = selectBotMove(lines, BOT_LEVELS[0], rng);
      expect(lines.map((l) => l.moveUci)).toContain(chosen);
    }
  });

  it("a bassa temperatura (livello alto) sceglie quasi sempre la mossa migliore", () => {
    const lines = [line(1, "e2e4", 120), line(2, "a2a3", -50)];
    const rng = createRng(7);
    let bestCount = 0;
    for (let i = 0; i < 100; i++) {
      if (selectBotMove(lines, BOT_LEVELS[9], rng) === "e2e4") bestCount++;
    }
    expect(bestCount).toBeGreaterThan(90);
  });

  it("è deterministico a parità di seme", () => {
    const lines = [line(1, "e2e4", 30), line(2, "d2d4", 25), line(3, "c2c4", 20)];
    const a = selectBotMove(lines, BOT_LEVELS[2], createRng(123));
    const b = selectBotMove(lines, BOT_LEVELS[2], createRng(123));
    expect(a).toBe(b);
  });

  it("la mossa scelta è legale nella posizione (integrazione con chess.js)", () => {
    const chess = new Chess();
    const legalMoves = chess.moves({ verbose: true }).slice(0, 3);
    const lines = legalMoves.map((move, index) =>
      line(index + 1, `${move.from}${move.to}${move.promotion ?? ""}`, 50 - index * 10),
    );
    const chosen = selectBotMove(lines, BOT_LEVELS[2], createRng(9));
    expect(chosen).toBeTruthy();
    expect(() => {
      const applied = new Chess();
      applied.move({ from: chosen!.slice(0, 2), to: chosen!.slice(2, 4) });
    }).not.toThrow();
  });

  it("restituisce null se non ci sono candidate", () => {
    expect(selectBotMove([], BOT_LEVELS[2], createRng(1))).toBeNull();
  });

  it("usa una mossa legale reale come punto di partenza del fake engine", () => {
    // sanity check dell'helper condiviso
    expect(firstLegalUci(new Chess().fen())).toMatch(/^[a-h][1-8][a-h][1-8]/);
  });
});
