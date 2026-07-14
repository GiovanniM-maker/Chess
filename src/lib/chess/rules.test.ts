import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { getResult, materialByColor } from "./index";

describe("regole degli scacchi", () => {
  it("gestisce l'arrocco corto del bianco", () => {
    const chess = new Chess("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    const move = chess.move("O-O");
    expect(move.flags).toContain("k");
    expect(chess.get("g1")).toMatchObject({ type: "k", color: "w" });
    expect(chess.get("f1")).toMatchObject({ type: "r", color: "w" });
  });

  it("gestisce la cattura en passant", () => {
    const chess = new Chess("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1");
    const move = chess.move({ from: "e5", to: "d6" });
    expect(move.flags).toContain("e");
    expect(chess.get("d5")).toBeFalsy();
    expect(chess.get("d6")).toMatchObject({ type: "p", color: "w" });
  });

  it("gestisce la promozione a donna", () => {
    const chess = new Chess("4k3/P7/8/8/8/8/8/4K3 w - - 0 1");
    const move = chess.move({ from: "a7", to: "a8", promotion: "q" });
    expect(move.promotion).toBe("q");
    expect(chess.get("a8")).toMatchObject({ type: "q", color: "w" });
  });

  it("riconosce lo scacco matto (matto del barbiere)", () => {
    const chess = new Chess();
    chess.move("f3");
    chess.move("e5");
    chess.move("g4");
    chess.move("Qh4#");
    expect(chess.isCheckmate()).toBe(true);
    expect(getResult(chess)).toEqual({ winner: "black", reason: "checkmate" });
  });

  it("riconosce lo stallo", () => {
    const chess = new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
    expect(chess.isStalemate()).toBe(true);
    expect(getResult(chess)).toEqual({ winner: "draw", reason: "stalemate" });
  });

  it("riconosce il materiale insufficiente", () => {
    const chess = new Chess("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    expect(getResult(chess)).toEqual({ winner: "draw", reason: "insufficient-material" });
  });

  it("calcola il materiale per colore", () => {
    const material = materialByColor(new Chess());
    // Posizione iniziale: 8 pedoni, 2C, 2A, 2T, 1D = 8 + 6 + 6 + 10 + 9 = 39
    expect(material.w).toBe(39);
    expect(material.b).toBe(39);
  });
});
