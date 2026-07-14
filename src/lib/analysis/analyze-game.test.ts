import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import type { ChessEngine, EngineEvaluation, EvaluateOptions } from "@/lib/engine";
import { analyzeGame } from "./analyze-game";

function firstLegalUci(fen: string): string {
  const move = new Chess(fen).moves({ verbose: true })[0]!;
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

/**
 * Motore finto e deterministico: alterna una valutazione "prima" alta e una
 * "dopo" bassa, così ogni mossa del giocatore risulta un errore rilevante.
 * Permette di testare la pipeline di analisi senza WebAssembly.
 */
class FakeEngine implements ChessEngine {
  private calls = 0;
  ready(): Promise<void> {
    return Promise.resolve();
  }
  evaluate(fen: string, _opts: EvaluateOptions): Promise<EngineEvaluation> {
    this.calls += 1;
    const isBefore = this.calls % 2 === 1;
    const scoreCp = isBefore ? 250 : 100;
    const best = firstLegalUci(fen);
    return Promise.resolve({
      bestMoveUci: best,
      lines: [{ rank: 1, moveUci: best, scoreCp, mate: null, pv: [best] }],
      depth: 12,
    });
  }
  dispose(): void {}
}

describe("analisi completa di una partita", () => {
  it("individua gli errori del giocatore e li classifica", async () => {
    const engine = new FakeEngine();
    const progress: Array<[number, number]> = [];
    const moments = await analyzeGame({
      sanMoves: ["e4", "e5", "Qh5", "Nc6"],
      playerColor: "w",
      engine,
      depth: 12,
      onProgress: (done, total) => progress.push([done, total]),
    });

    // Il bianco ha giocato 2 mosse: entrambe risultano errori con questo motore.
    expect(moments).toHaveLength(2);
    expect(new Set(moments.map((m) => m.ply))).toEqual(new Set([1, 3]));

    for (const moment of moments) {
      expect(moment.centipawnLoss).toBe(350);
      expect(moment.bestSan).toBeTruthy();
      expect([
        "pezzo-perso",
        "tattica-mancata",
        "problema-sviluppo",
        "re-esposto",
        "occasione-mancata",
      ]).toContain(moment.type);
    }

    // L'avanzamento arriva a completamento (2 mosse del giocatore).
    expect(progress.at(-1)).toEqual([2, 2]);
  });

  it("non analizza le mosse dell'avversario", async () => {
    const engine = new FakeEngine();
    const moments = await analyzeGame({
      sanMoves: ["e4", "e5"],
      playerColor: "b",
      engine,
      depth: 12,
    });
    // Il nero ha giocato solo 1 mossa.
    expect(moments.every((m) => m.colorMoved === "b")).toBe(true);
    expect(moments.length).toBeLessThanOrEqual(1);
  });
});
