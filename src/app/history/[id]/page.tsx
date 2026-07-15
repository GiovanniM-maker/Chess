"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getGame,
  updateGameAnalysis,
  updateGameFeedback,
  updateGameIntention,
} from "@/lib/storage";
import { resolveBotLevel } from "@/lib/bot";
import { StockfishEngine } from "@/lib/engine";
import { analyzeGame } from "@/lib/analysis";
import { formatDate, outcomeTitle, playerOutcome, reasonLabel } from "@/lib/format";
import type { GameAnalysis, IntentionValue, SavedGame } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewPanel } from "@/components/game/ReviewPanel";
import { ReplayView } from "@/components/game/ReplayView";
import { AnalyzingScreen } from "@/components/game/AnalyzingScreen";
import type { AnalysisProgress } from "@/lib/game/use-game-controller";

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [game, setGame] = React.useState<SavedGame | null | undefined>(undefined);
  const [intentions, setIntentions] = React.useState<Record<string, IntentionValue>>({});
  const [feedbacks, setFeedbacks] = React.useState<Record<string, "up" | "down">>({});
  const [replayMomentId, setReplayMomentId] = React.useState<string | null>(null);
  const [analyzing, setAnalyzing] = React.useState<AnalysisProgress | null>(null);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    void getGame(id).then((loaded) => {
      if (!active) return;
      setGame(loaded ?? null);
      setIntentions(loaded?.intentions ?? {});
      setFeedbacks(loaded?.explanationFeedback ?? {});
    });
    return () => {
      active = false;
    };
  }, [id]);

  const onSetIntention = (momentId: string, value: IntentionValue) => {
    setIntentions((prev) => ({ ...prev, [momentId]: value }));
    void updateGameIntention(id, momentId, value);
  };

  const onFeedback = (momentId: string, value: "up" | "down") => {
    setFeedbacks((prev) => ({ ...prev, [momentId]: value }));
    void updateGameFeedback(id, momentId, value);
  };

  // Analizza (o ri-analizza) la partita direttamente dallo storico: serve per
  // le partite con un amico e per i salvataggi precedenti alle varianti.
  const runAnalysis = async (current: SavedGame) => {
    let engine: StockfishEngine | null = null;
    setAnalysisError(null);
    setAnalyzing({ done: 0, total: 0 });
    try {
      engine = new StockfishEngine();
      const moments = await analyzeGame({
        sanMoves: current.moves.map((move) => move.san),
        playerColor: current.playerColor,
        engine,
        depth: 12,
        onProgress: (done, total) => setAnalyzing({ done, total }),
      });
      const analysis: GameAnalysis = { generatedAt: Date.now(), moments };
      await updateGameAnalysis(current.id, analysis);
      setGame({ ...current, analysis });
    } catch {
      setAnalysisError("Analisi non riuscita: riprova ricaricando la pagina.");
    } finally {
      engine?.dispose();
      setAnalyzing(null);
    }
  };

  if (game === undefined) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Caricamento…</p>;
  }

  if (game === null) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-muted-foreground">Partita non trovata.</p>
        <Link href="/history" className={buttonVariants({ variant: "outline" })}>
          Torna allo storico
        </Link>
      </div>
    );
  }

  const moments = game.analysis?.moments ?? [];

  if (replayMomentId) {
    const moment = moments.find((item) => item.id === replayMomentId);
    if (moment) {
      return (
        <ReplayView
          moment={moment}
          orientation={game.playerColor}
          onBack={() => setReplayMomentId(null)}
        />
      );
    }
  }

  if (analyzing) {
    return <AnalyzingScreen progress={analyzing} />;
  }

  const outcome = playerOutcome(game.result, game.playerColor);
  const opponentLabel = game.mode === "friend" ? "Amico" : resolveBotLevel(game.botLevel).label;

  return (
    <div className="space-y-5">
      <Link
        href="/history"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2" })}
      >
        ← Storico
      </Link>

      <Card>
        <CardContent className="space-y-1 p-4">
          <h1 className="text-xl font-bold">{outcomeTitle(outcome)}</h1>
          <p className="text-sm text-muted-foreground">
            {opponentLabel} · {formatDate(game.createdAt)} · {reasonLabel(game.result.reason)}
          </p>
        </CardContent>
      </Card>

      {analysisError && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{analysisError}</p>
      )}

      {game.analysis ? (
        <>
          <h2 className="text-lg font-semibold">Review</h2>
          <ReviewPanel
            moments={moments}
            intentions={intentions}
            feedbacks={feedbacks}
            playerColor={game.playerColor}
            onSetIntention={onSetIntention}
            onFeedback={onFeedback}
            onOpenReplay={setReplayMomentId}
          />
        </>
      ) : (
        <div className="space-y-3 rounded-lg border p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Questa partita non è ancora stata analizzata.
          </p>
          <Button onClick={() => void runAnalysis(game)} disabled={game.moves.length === 0}>
            Analizza questa partita
          </Button>
        </div>
      )}
    </div>
  );
}
