import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { classifyMoment, type ClassifyInput } from "./classify";

function base(overrides: Partial<ClassifyInput>): ClassifyInput {
  return {
    moveNumber: 20,
    colorMoved: "w",
    fenBefore: "6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 30",
    fenAfter: "6k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 30",
    playedUci: "f2f3",
    bestUci: "g2g3",
    scoreBeforeCp: 100,
    scoreAfterCp: -100,
    centipawnLoss: 200,
    opponentBestUci: null,
    ...overrides,
  };
}

describe("classificazione dei momenti", () => {
  it("riconosce un pezzo lasciato in presa", () => {
    // Il bianco muove l'alfiere su e4 dove un pedone nero lo cattura gratis.
    const fenBefore = "4k3/8/8/3p4/8/8/6B1/4K3 w - - 0 1";
    const applied = new Chess(fenBefore);
    applied.move({ from: "g2", to: "e4" });
    const result = classifyMoment(
      base({
        moveNumber: 12,
        fenBefore,
        fenAfter: applied.fen(),
        playedUci: "g2e4",
        bestUci: "e1e2",
        opponentBestUci: "d5e4",
        centipawnLoss: 300,
        scoreBeforeCp: 50,
        scoreAfterCp: -250,
      }),
    );
    expect(result).toBe("pezzo-perso");
  });

  it("riconosce un problema di sviluppo (donna troppo presto)", () => {
    const fenBefore = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
    const result = classifyMoment(
      base({
        moveNumber: 2,
        fenBefore,
        playedUci: "d1h5",
        bestUci: "g1f3",
        centipawnLoss: 120,
        scoreBeforeCp: 20,
        scoreAfterCp: -100,
      }),
    );
    expect(result).toBe("problema-sviluppo");
  });

  it("usa 'occasione mancata' come categoria di default", () => {
    const result = classifyMoment(base({ opponentBestUci: "g8f8" }));
    expect(result).toBe("occasione-mancata");
  });
});
