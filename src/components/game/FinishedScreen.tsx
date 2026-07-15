"use client";

import type { GameResultInfo, PieceColor } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { GameOverView } from "./GameOverView";

export interface FinishedScreenProps {
  result: GameResultInfo;
  playerColor: PieceColor;
  finalFen: string;
  lastMove: { from: string; to: string } | null;
  engineError: string | null;
  /** Banner di progressione (calibrazione, promozione del Rivale…). */
  banner?: React.ReactNode;
  onAnalyze: () => void;
  onNewGame: () => void;
}

export function FinishedScreen({
  result,
  playerColor,
  finalFen,
  lastMove,
  engineError,
  banner,
  onAnalyze,
  onNewGame,
}: FinishedScreenProps) {
  return (
    <GameOverView result={result} playerColor={playerColor} finalFen={finalFen} lastMove={lastMove}>
      {banner}
      {engineError ? (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{engineError}</p>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Analizza la partita per scoprire i tuoi tre errori principali e come correggerli.
        </p>
      )}
      <Button size="lg" className="w-full" onClick={onAnalyze} disabled={Boolean(engineError)}>
        Analizza la partita
      </Button>
      <Button variant="outline" className="w-full" onClick={onNewGame}>
        Nuova partita
      </Button>
    </GameOverView>
  );
}
