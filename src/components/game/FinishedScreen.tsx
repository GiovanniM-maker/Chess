"use client";

import type { GameResultInfo, PieceColor } from "@/lib/types";
import { outcomeTitle, playerOutcome, reasonLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface FinishedScreenProps {
  result: GameResultInfo;
  playerColor: PieceColor;
  engineError: string | null;
  onAnalyze: () => void;
  onNewGame: () => void;
}

export function FinishedScreen({
  result,
  playerColor,
  engineError,
  onAnalyze,
  onNewGame,
}: FinishedScreenProps) {
  const outcome = playerOutcome(result, playerColor);

  return (
    <div className="space-y-6 text-center">
      <Card>
        <CardContent className="space-y-1 p-6">
          <h2 className="text-2xl font-bold">{outcomeTitle(outcome)}</h2>
          <p className="text-sm text-muted-foreground">
            Partita conclusa per {reasonLabel(result.reason)}.
          </p>
        </CardContent>
      </Card>

      {engineError ? (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{engineError}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Analizza la partita per scoprire i tuoi tre errori principali e come correggerli.
        </p>
      )}

      <div className="space-y-2">
        <Button size="lg" className="w-full" onClick={onAnalyze} disabled={Boolean(engineError)}>
          Analizza la partita
        </Button>
        <Button variant="outline" className="w-full" onClick={onNewGame}>
          Nuova partita
        </Button>
      </div>
    </div>
  );
}
