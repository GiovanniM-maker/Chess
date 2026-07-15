"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import type Peer from "peerjs";
import type { DataConnection } from "peerjs";
import { getResult } from "@/lib/chess";
import { createGameId, saveGame } from "@/lib/storage";
import type { GameResultInfo, PieceColor, SavedGame, StoredMove } from "@/lib/types";
import { parseFriendMessage, tryApplyRemoteMove, type FriendMessage } from "./protocol";

/** Fasi della partita con un amico via link. Nessuno stato implicito. */
export type FriendPhase =
  | "setup" // l'host sceglie il colore
  | "waiting" // l'host ha il link e aspetta l'amico
  | "connecting" // l'ospite si sta collegando alla stanza
  | "playing"
  | "finished"
  | "error";

export type ColorChoice = PieceColor | "random";

export interface FriendGame {
  phase: FriendPhase;
  isHost: boolean;
  myColor: PieceColor;
  fen: string;
  historySan: string[];
  lastMove: { from: string; to: string } | null;
  result: GameResultInfo | null;
  shareUrl: string | null;
  connectionLost: boolean;
  errorMessage: string | null;
  savedGameId: string | null;
  isMyTurn: boolean;
  createRoom: (color: ColorChoice) => void;
  joinRoom: (roomId: string) => void;
  playMove: (from: string, to: string, promotion?: string) => boolean;
  resign: () => void;
}

const CONNECTION_ERROR =
  "Impossibile stabilire la connessione. Controlla la rete di entrambi e riprova con un nuovo link.";

function opposite(color: PieceColor): PieceColor {
  return color === "w" ? "b" : "w";
}

function buildStoredMoves(sanMoves: string[]): StoredMove[] {
  const replay = new Chess();
  const moves: StoredMove[] = [];
  sanMoves.forEach((san, index) => {
    try {
      replay.move(san);
      moves.push({ ply: index + 1, san, fenAfter: replay.fen() });
    } catch {
      // storia non valida oltre questo punto
    }
  });
  return moves;
}

/**
 * Partita peer-to-peer via link (WebRTC tramite PeerJS): l'host crea una
 * stanza, il link contiene l'id; l'amico apre il link e si collega
 * direttamente, senza alcun backend nostro. Entrambi i client validano ogni
 * mossa con chess.js (ply atteso + legalità), quindi una mossa illegale o
 * duplicata non viene mai applicata.
 */
export function useFriendGame(): FriendGame {
  const chessRef = useRef<Chess>(new Chess());
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const myColorRef = useRef<PieceColor>("w");
  const phaseRef = useRef<FriendPhase>("setup");
  const savedRef = useRef(false);

  const [phase, setPhaseState] = useState<FriendPhase>("setup");
  const [isHost, setIsHost] = useState(true);
  const [myColor, setMyColor] = useState<PieceColor>("w");
  const [fen, setFen] = useState<string>(new Chess().fen());
  const [historySan, setHistorySan] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [result, setResult] = useState<GameResultInfo | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [connectionLost, setConnectionLost] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedGameId, setSavedGameId] = useState<string | null>(null);

  const setPhase = useCallback((next: FriendPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const syncBoard = useCallback(() => {
    setFen(chessRef.current.fen());
    setHistorySan(chessRef.current.history());
  }, []);

  const setColor = useCallback((color: PieceColor) => {
    myColorRef.current = color;
    setMyColor(color);
  }, []);

  useEffect(() => {
    return () => {
      connRef.current?.close();
      peerRef.current?.destroy();
    };
  }, []);

  const persistGame = useCallback(async (finalResult: GameResultInfo) => {
    if (savedRef.current) return;
    savedRef.current = true;
    const sanMoves = chessRef.current.history();
    const id = createGameId();
    const game: SavedGame = {
      id,
      createdAt: Date.now(),
      mode: "friend",
      playerColor: myColorRef.current,
      result: finalResult,
      pgn: chessRef.current.pgn(),
      finalFen: chessRef.current.fen(),
      moves: buildStoredMoves(sanMoves),
    };
    await saveGame(game);
    setSavedGameId(id);
  }, []);

  const finish = useCallback(
    (finalResult: GameResultInfo) => {
      setResult(finalResult);
      setPhase("finished");
      void persistGame(finalResult);
    },
    [persistGame, setPhase],
  );

  const endIfOver = useCallback((): boolean => {
    const outcome = getResult(chessRef.current);
    if (outcome) {
      finish(outcome);
      return true;
    }
    return false;
  }, [finish]);

  const send = useCallback((msg: FriendMessage) => {
    connRef.current?.send(msg);
  }, []);

  const handleMessage = useCallback(
    (raw: unknown) => {
      const msg = parseFriendMessage(raw);
      if (!msg) return;
      if (msg.type === "init") {
        setColor(msg.yourColor);
        setPhase("playing");
        return;
      }
      if (msg.type === "sync") {
        setColor(msg.yourColor);
        try {
          chessRef.current.loadPgn(msg.pgn);
        } catch {
          chessRef.current = new Chess();
        }
        syncBoard();
        setPhase("playing");
        return;
      }
      if (msg.type === "move") {
        const applied = tryApplyRemoteMove(chessRef.current, msg, opposite(myColorRef.current));
        if (applied.ok) {
          setLastMove({ from: applied.from!, to: applied.to! });
          syncBoard();
          endIfOver();
        }
        return;
      }
      // resign dell'avversario
      if (phaseRef.current === "playing") {
        finish({
          winner: myColorRef.current === "w" ? "white" : "black",
          reason: "resignation",
        });
      }
    },
    [endIfOver, finish, setColor, setPhase, syncBoard],
  );

  const wireConnection = useCallback(
    (conn: DataConnection) => {
      connRef.current = conn;
      conn.on("data", handleMessage);
      conn.on("close", () => {
        if (phaseRef.current === "playing") setConnectionLost(true);
      });
      conn.on("error", () => {
        if (phaseRef.current === "playing") setConnectionLost(true);
      });
    },
    [handleMessage],
  );

  const createRoom = useCallback(
    (colorChoice: ColorChoice) => {
      const chosen: PieceColor =
        colorChoice === "random" ? (Math.random() < 0.5 ? "w" : "b") : colorChoice;
      setColor(chosen);
      setIsHost(true);
      setPhase("waiting");

      const roomId = `pensa-${crypto.randomUUID()}`;
      void (async () => {
        try {
          const { default: PeerCtor } = await import("peerjs");
          const peer = new PeerCtor(roomId);
          peerRef.current = peer;
          peer.on("open", () => {
            setShareUrl(`${window.location.origin}/friend?room=${roomId}`);
          });
          peer.on("connection", (conn) => {
            wireConnection(conn);
            conn.on("open", () => {
              setConnectionLost(false);
              const guestColor = opposite(myColorRef.current);
              if (chessRef.current.history().length > 0) {
                send({ type: "sync", yourColor: guestColor, pgn: chessRef.current.pgn() });
              } else {
                send({ type: "init", yourColor: guestColor });
              }
              setPhase("playing");
            });
          });
          peer.on("error", () => {
            if (phaseRef.current === "waiting") {
              setErrorMessage(CONNECTION_ERROR);
              setPhase("error");
            } else if (phaseRef.current === "playing") {
              setConnectionLost(true);
            }
          });
        } catch {
          setErrorMessage(CONNECTION_ERROR);
          setPhase("error");
        }
      })();
    },
    [send, setColor, setPhase, wireConnection],
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      setIsHost(false);
      setPhase("connecting");
      void (async () => {
        try {
          const { default: PeerCtor } = await import("peerjs");
          const peer = new PeerCtor();
          peerRef.current = peer;
          peer.on("open", () => {
            const conn = peer.connect(roomId, { reliable: true });
            wireConnection(conn);
            // resta in "connecting" finché l'host non invia init/sync
          });
          peer.on("error", () => {
            if (phaseRef.current === "connecting") {
              setErrorMessage(
                "Stanza non trovata: chiedi al tuo amico un nuovo link (deve tenere la pagina aperta).",
              );
              setPhase("error");
            } else if (phaseRef.current === "playing") {
              setConnectionLost(true);
            }
          });
        } catch {
          setErrorMessage(CONNECTION_ERROR);
          setPhase("error");
        }
      })();
    },
    [setPhase, wireConnection],
  );

  const playMove = useCallback(
    (from: string, to: string, promotion?: string): boolean => {
      if (phaseRef.current !== "playing" || connectionLost) return false;
      if (chessRef.current.turn() !== myColorRef.current) return false;
      let move;
      try {
        move = chessRef.current.move({ from, to, promotion: promotion ?? "q" });
      } catch {
        return false;
      }
      if (!move) return false;
      setLastMove({ from: move.from, to: move.to });
      syncBoard();
      send({ type: "move", san: move.san, ply: chessRef.current.history().length });
      endIfOver();
      return true;
    },
    [connectionLost, endIfOver, send, syncBoard],
  );

  const resign = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    send({ type: "resign" });
    finish({
      winner: myColorRef.current === "w" ? "black" : "white",
      reason: "resignation",
    });
  }, [finish, send]);

  return {
    phase,
    isHost,
    myColor,
    fen,
    historySan,
    lastMove,
    result,
    shareUrl,
    connectionLost,
    errorMessage,
    savedGameId,
    isMyTurn: phase === "playing" && !connectionLost && chessRef.current.turn() === myColor,
    createRoom,
    joinRoom,
    playMove,
    resign,
  };
}
