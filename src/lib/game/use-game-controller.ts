"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { StockfishEngine } from "@/lib/engine";
import { BOT_LEVELS, createRng, randomLegalMove, selectBotMove } from "@/lib/bot";
import { analyzeGame } from "@/lib/analysis";
import { getResult } from "@/lib/chess";
import { createGameId, saveGame, updateGameIntention } from "@/lib/storage";
import type {
  AnalysisMoment,
  BotLevelId,
  GameResultInfo,
  IntentionValue,
  PieceColor,
  SavedGame,
  StoredMove,
} from "@/lib/types";
import type { GamePhase } from "./phase";

export interface AnalysisProgress {
  done: number;
  total: number;
}

export interface GameController {
  phase: GamePhase;
  playerColor: PieceColor;
  botLevel: BotLevelId;
  fen: string;
  historySan: string[];
  lastMove: { from: string; to: string } | null;
  result: GameResultInfo | null;
  isBotThinking: boolean;
  engineError: string | null;
  analysis: AnalysisMoment[] | null;
  analysisProgress: AnalysisProgress | null;
  savedGameId: string | null;
  activeMomentId: string | null;
  intentions: Record<string, IntentionValue>;
  boardOrientation: "white" | "black";
  isPlayerTurn: boolean;
  startGame: (color: PieceColor, level: BotLevelId) => void;
  playerMove: (from: string, to: string, promotion?: string) => boolean;
  resign: () => void;
  requestAnalysis: () => Promise<void>;
  reset: () => void;
  openReplay: (momentId: string) => void;
  goToReview: () => void;
  setIntention: (momentId: string, value: IntentionValue) => void;
}

const ENGINE_ERROR_MESSAGE =
  "Il motore scacchistico non è disponibile in questo browser. Ricarica la pagina o prova con un browser aggiornato.";

// Il bot non risponde mai istantaneamente: una breve pausa (1,2–2s) dà il
// tempo di vedere la propria mossa e rende il ritmo più naturale.
const BOT_REPLY_DELAY_MIN_MS = 1200;
const BOT_REPLY_DELAY_JITTER_MS = 800;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildStoredMoves(sanMoves: string[]): StoredMove[] {
  const replay = new Chess();
  const moves: StoredMove[] = [];
  sanMoves.forEach((san, index) => {
    try {
      replay.move(san);
      moves.push({ ply: index + 1, san, fenAfter: replay.fen() });
    } catch {
      // mossa non applicabile: ignorata (non dovrebbe accadere su storia valida)
    }
  });
  return moves;
}

export function useGameController(): GameController {
  const chessRef = useRef<Chess>(new Chess());
  const engineRef = useRef<StockfishEngine | null>(null);
  const rngRef = useRef<() => number>(() => Math.random());
  const playerColorRef = useRef<PieceColor>("w");
  const botLevelRef = useRef<BotLevelId>(2);
  const phaseRef = useRef<GamePhase>("setup");

  const [phase, setPhaseState] = useState<GamePhase>("setup");
  const [playerColor, setPlayerColor] = useState<PieceColor>("w");
  const [botLevel, setBotLevel] = useState<BotLevelId>(2);
  const [fen, setFen] = useState<string>(new Chess().fen());
  const [historySan, setHistorySan] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [result, setResult] = useState<GameResultInfo | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisMoment[] | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [savedGameId, setSavedGameId] = useState<string | null>(null);
  const [activeMomentId, setActiveMomentId] = useState<string | null>(null);
  const [intentions, setIntentions] = useState<Record<string, IntentionValue>>({});

  useEffect(() => {
    try {
      engineRef.current = new StockfishEngine();
    } catch {
      setEngineError(ENGINE_ERROR_MESSAGE);
    }
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const setPhase = useCallback((next: GamePhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const syncBoard = useCallback(() => {
    setFen(chessRef.current.fen());
    setHistorySan(chessRef.current.history());
  }, []);

  /** Applica l'esito se la partita è terminata; restituisce true in tal caso. */
  const applyEndIfOver = useCallback((): boolean => {
    const outcome = getResult(chessRef.current);
    if (outcome) {
      setResult(outcome);
      setPhase("finished");
      return true;
    }
    return false;
  }, [setPhase]);

  const runBotMove = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) {
      setEngineError(ENGINE_ERROR_MESSAGE);
      return;
    }
    setIsBotThinking(true);
    try {
      const startedAt = Date.now();
      await engine.ready();
      if (phaseRef.current !== "playing") return;
      const config = BOT_LEVELS[botLevelRef.current];
      // Ai livelli bassi il bot gioca a volte una mossa legale casuale: è ciò
      // che lo rende costantemente debole (non "forte con regali improvvisi").
      let uci: string | null = null;
      if (config.randomMoveChance > 0 && rngRef.current() < config.randomMoveChance) {
        uci = randomLegalMove(chessRef.current.fen(), rngRef.current);
      }
      if (!uci) {
        const evaluation = await engine.evaluate(chessRef.current.fen(), {
          depth: config.depth,
          multipv: config.multipv,
        });
        uci = selectBotMove(evaluation.lines, config, rngRef.current) ?? evaluation.bestMoveUci;
      }
      // Attende il tempo minimo di "riflessione" prima di applicare la mossa.
      const targetDelay =
        BOT_REPLY_DELAY_MIN_MS + Math.floor(rngRef.current() * BOT_REPLY_DELAY_JITTER_MS);
      const elapsed = Date.now() - startedAt;
      if (elapsed < targetDelay) await sleep(targetDelay - elapsed);
      if (phaseRef.current !== "playing") return;
      if (uci) {
        const move = chessRef.current.move({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: uci.length > 4 ? uci.slice(4, 5) : undefined,
        });
        if (move) setLastMove({ from: move.from, to: move.to });
      }
      syncBoard();
      applyEndIfOver();
    } catch {
      setEngineError(ENGINE_ERROR_MESSAGE);
    } finally {
      setIsBotThinking(false);
    }
  }, [applyEndIfOver, syncBoard]);

  const startGame = useCallback(
    (color: PieceColor, level: BotLevelId) => {
      chessRef.current = new Chess();
      rngRef.current = createRng((Date.now() ^ (Math.random() * 1e9)) >>> 0);
      playerColorRef.current = color;
      botLevelRef.current = level;
      setPlayerColor(color);
      setBotLevel(level);
      setResult(null);
      setAnalysis(null);
      setAnalysisProgress(null);
      setSavedGameId(null);
      setActiveMomentId(null);
      setIntentions({});
      setLastMove(null);
      setPhase("playing");
      syncBoard();
      if (color === "b") void runBotMove();
    },
    [runBotMove, setPhase, syncBoard],
  );

  const playerMove = useCallback(
    (from: string, to: string, promotion?: string): boolean => {
      if (phaseRef.current !== "playing" || isBotThinking) return false;
      if (chessRef.current.turn() !== playerColorRef.current) return false;
      let move;
      try {
        move = chessRef.current.move({ from, to, promotion: promotion ?? "q" });
      } catch {
        return false;
      }
      if (!move) return false;
      setLastMove({ from: move.from, to: move.to });
      syncBoard();
      if (!applyEndIfOver()) void runBotMove();
      return true;
    },
    [applyEndIfOver, isBotThinking, runBotMove, syncBoard],
  );

  const resign = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    const winner = playerColorRef.current === "w" ? "black" : "white";
    setResult({ winner, reason: "resignation" });
    setPhase("finished");
  }, [setPhase]);

  const requestAnalysis = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) {
      setEngineError(ENGINE_ERROR_MESSAGE);
      return;
    }
    const currentResult = result;
    if (!currentResult) return;
    setPhase("analyzing");
    setAnalysisProgress({ done: 0, total: 0 });
    try {
      const sanMoves = chessRef.current.history();
      const moments = await analyzeGame({
        sanMoves,
        playerColor: playerColorRef.current,
        engine,
        depth: 12,
        onProgress: (done, total) => setAnalysisProgress({ done, total }),
      });
      setAnalysis(moments);

      const id = createGameId();
      const game: SavedGame = {
        id,
        createdAt: Date.now(),
        mode: "bot",
        playerColor: playerColorRef.current,
        botLevel: botLevelRef.current,
        result: currentResult,
        pgn: chessRef.current.pgn(),
        finalFen: chessRef.current.fen(),
        moves: buildStoredMoves(sanMoves),
        analysis: { generatedAt: Date.now(), moments },
      };
      await saveGame(game);
      setSavedGameId(id);
      setPhase("review");
    } catch {
      setEngineError(ENGINE_ERROR_MESSAGE);
      setPhase("finished");
    }
  }, [result, setPhase]);

  const reset = useCallback(() => {
    chessRef.current = new Chess();
    setResult(null);
    setAnalysis(null);
    setAnalysisProgress(null);
    setSavedGameId(null);
    setActiveMomentId(null);
    setLastMove(null);
    setPhase("setup");
    syncBoard();
  }, [setPhase, syncBoard]);

  const openReplay = useCallback(
    (momentId: string) => {
      setActiveMomentId(momentId);
      setPhase("replay");
    },
    [setPhase],
  );

  const goToReview = useCallback(() => {
    setActiveMomentId(null);
    setPhase("review");
  }, [setPhase]);

  const setIntention = useCallback(
    (momentId: string, value: IntentionValue) => {
      setIntentions((prev) => ({ ...prev, [momentId]: value }));
      if (savedGameId) void updateGameIntention(savedGameId, momentId, value);
    },
    [savedGameId],
  );

  return {
    phase,
    playerColor,
    botLevel,
    fen,
    historySan,
    lastMove,
    result,
    isBotThinking,
    engineError,
    analysis,
    analysisProgress,
    savedGameId,
    activeMomentId,
    intentions,
    boardOrientation: playerColor === "w" ? "white" : "black",
    isPlayerTurn: phase === "playing" && !isBotThinking && chessRef.current.turn() === playerColor,
    startGame,
    playerMove,
    resign,
    requestAnalysis,
    reset,
    openReplay,
    goToReview,
    setIntention,
  };
}
