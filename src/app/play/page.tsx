"use client";

import Link from "next/link";
import { useGameController } from "@/lib/game/use-game-controller";
import { BOT_LEVELS } from "@/lib/bot";
import { Button, buttonVariants } from "@/components/ui/button";
import { SetupScreen } from "@/components/game/SetupScreen";
import { PlayingScreen } from "@/components/game/PlayingScreen";
import { FinishedScreen } from "@/components/game/FinishedScreen";
import { AnalyzingScreen } from "@/components/game/AnalyzingScreen";
import { ReviewPanel } from "@/components/game/ReviewPanel";
import { ReplayView } from "@/components/game/ReplayView";

export default function PlayPage() {
  const game = useGameController();

  if (game.phase === "setup") {
    return <SetupScreen onStart={game.startGame} />;
  }

  if (game.phase === "playing") {
    return (
      <PlayingScreen
        fen={game.fen}
        playerColor={game.playerColor}
        lastMove={game.lastMove}
        isPlayerTurn={game.isPlayerTurn}
        isBotThinking={game.isBotThinking}
        historySan={game.historySan}
        botLevelLabel={`Livello ${game.botLevel} · ${BOT_LEVELS[game.botLevel].label}`}
        onMove={game.playerMove}
        onResign={game.resign}
      />
    );
  }

  if (game.phase === "finished" && game.result) {
    return (
      <FinishedScreen
        result={game.result}
        playerColor={game.playerColor}
        engineError={game.engineError}
        onAnalyze={game.requestAnalysis}
        onNewGame={game.reset}
      />
    );
  }

  if (game.phase === "analyzing") {
    return <AnalyzingScreen progress={game.analysisProgress} />;
  }

  if (game.phase === "replay" && game.analysis) {
    const moment = game.analysis.find((item) => item.id === game.activeMomentId);
    if (moment) {
      return <ReplayView moment={moment} orientation={game.playerColor} onBack={game.goToReview} />;
    }
  }

  if (game.phase === "review" && game.analysis) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">La tua review</h2>
        <ReviewPanel
          moments={game.analysis}
          intentions={game.intentions}
          playerColor={game.playerColor}
          onSetIntention={game.setIntention}
          onOpenReplay={game.openReplay}
        />
        <div className="space-y-2">
          <Button className="w-full" onClick={game.reset}>
            Nuova partita
          </Button>
          <Link
            href="/history"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            Vai allo storico
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
