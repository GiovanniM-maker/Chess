import { describe, expect, it } from "vitest";
import { Chess, legalTargets, positionAtPly } from "./index";

describe("legalTargets (pallini delle mosse legali)", () => {
  it("pedone in posizione iniziale: due case, nessuna cattura", () => {
    const targets = legalTargets(new Chess().fen(), "e2");
    expect(targets.map((target) => target.to).sort()).toEqual(["e3", "e4"]);
    expect(targets.every((target) => !target.isCapture)).toBe(true);
  });

  it("distingue le catture dalle case vuote", () => {
    // Pedone bianco in e4, pedone nero in d5: e4 può avanzare o catturare.
    const fen = "4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1";
    const targets = legalTargets(fen, "e4");
    expect(targets.find((target) => target.to === "d5")?.isCapture).toBe(true);
    expect(targets.find((target) => target.to === "e5")?.isCapture).toBe(false);
  });

  it("marca l'en passant come cattura", () => {
    const fen = "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1";
    const targets = legalTargets(fen, "e5");
    expect(targets.find((target) => target.to === "d6")?.isCapture).toBe(true);
  });

  it("restituisce vuoto per una casa senza pezzo", () => {
    expect(legalTargets(new Chess().fen(), "e5")).toEqual([]);
  });
});

describe("positionAtPly (navigazione della cronologia)", () => {
  const moves = ["e4", "e5", "Nf3"];

  it("ply 0 = posizione iniziale, senza ultima mossa", () => {
    const position = positionAtPly(moves, 0);
    expect(position.fen).toBe(new Chess().fen());
    expect(position.lastMove).toBeNull();
  });

  it("ricostruisce fen e ultima mossa a un ply intermedio", () => {
    const position = positionAtPly(moves, 2);
    const reference = new Chess();
    reference.move("e4");
    reference.move("e5");
    expect(position.fen).toBe(reference.fen());
    expect(position.lastMove).toEqual({ from: "e7", to: "e5" });
  });

  it("un ply oltre la fine equivale all'ultima posizione", () => {
    const full = positionAtPly(moves, moves.length);
    const beyond = positionAtPly(moves, moves.length + 5);
    expect(beyond.fen).toBe(full.fen);
    expect(beyond.lastMove).toEqual({ from: "g1", to: "f3" });
  });
});
