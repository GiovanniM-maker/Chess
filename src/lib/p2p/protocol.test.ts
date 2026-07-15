import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { parseFriendMessage, tryApplyRemoteMove } from "./protocol";

describe("parseFriendMessage (validazione dei dati di rete)", () => {
  it("accetta i messaggi ben formati", () => {
    expect(parseFriendMessage({ type: "init", yourColor: "b" })).toEqual({
      type: "init",
      yourColor: "b",
    });
    expect(parseFriendMessage({ type: "move", san: "e4", ply: 1 })).toEqual({
      type: "move",
      san: "e4",
      ply: 1,
    });
    expect(parseFriendMessage({ type: "sync", yourColor: "w", pgn: "1. e4" })).toEqual({
      type: "sync",
      yourColor: "w",
      pgn: "1. e4",
    });
    expect(parseFriendMessage({ type: "resign" })).toEqual({ type: "resign" });
  });

  it("rifiuta payload malformati o sconosciuti", () => {
    expect(parseFriendMessage(null)).toBeNull();
    expect(parseFriendMessage("move")).toBeNull();
    expect(parseFriendMessage({ type: "move", san: 42, ply: 1 })).toBeNull();
    expect(parseFriendMessage({ type: "init", yourColor: "x" })).toBeNull();
    expect(parseFriendMessage({ type: "hack" })).toBeNull();
  });
});

describe("tryApplyRemoteMove (autorevolezza locale)", () => {
  it("applica una mossa remota valida", () => {
    const chess = new Chess();
    const applied = tryApplyRemoteMove(chess, { san: "e4", ply: 1 }, "w");
    expect(applied.ok).toBe(true);
    expect(applied.from).toBe("e2");
    expect(chess.history()).toEqual(["e4"]);
  });

  it("scarta una mossa duplicata (stesso ply)", () => {
    const chess = new Chess();
    chess.move("e4");
    const applied = tryApplyRemoteMove(chess, { san: "e4", ply: 1 }, "w");
    expect(applied.ok).toBe(false);
    expect(chess.history()).toEqual(["e4"]);
  });

  it("scarta una mossa fuori ordine (ply futuro)", () => {
    const chess = new Chess();
    expect(tryApplyRemoteMove(chess, { san: "e5", ply: 3 }, "w").ok).toBe(false);
  });

  it("scarta una mossa quando non è il turno dell'avversario", () => {
    const chess = new Chess(); // tocca al Bianco
    expect(tryApplyRemoteMove(chess, { san: "e5", ply: 1 }, "b").ok).toBe(false);
  });

  it("scarta una mossa illegale senza corrompere lo stato", () => {
    const chess = new Chess();
    expect(tryApplyRemoteMove(chess, { san: "Qh5", ply: 1 }, "w").ok).toBe(false);
    expect(chess.history()).toEqual([]);
  });
});
