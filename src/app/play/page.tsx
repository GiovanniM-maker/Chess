"use client";

import * as React from "react";
import Link from "next/link";
import { useGameController } from "@/lib/game/use-game-controller";
import { usePlayer } from "@/lib/player/use-player";
import {
  CALIBRATION_TOTAL_GAMES,
  evaluateMission,
  type MissionOutcome,
  type ProgressionEvent,
} from "@/lib/player";
import { BOT_LEVELS } from "@/lib/bot";
import { playerOutcome } from "@/lib/format";
import type { BotLevelId, PieceColor } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SetupScreen } from "@/components/game/SetupScreen";
import { PlayingScreen } from "@/components/game/PlayingScreen";
import { FinishedScreen } from "@/components/game/FinishedScreen";
import { AnalyzingScreen } from "@/components/game/AnalyzingScreen";
import { ReviewPanel } from "@/components/game/ReviewPanel";
import { ReplayView } from "@/components/game/ReplayView";

function ProgressionBanner({ event }: { event: ProgressionEvent }) {
  const text =
    event.type === "calibration-step"
      ? `📏 Calibrazione: partita ${event.gamesPlayed} di ${event.totalGames} completata.`
      : event.type === "calibrated"
        ? `🎯 Calibrazione completata! Il tuo Rivale: Livello ${event.rivalLevel} — ${BOT_LEVELS[event.rivalLevel].label}.`
        : event.type === "promotion"
          ? `🏆 Rivale superato! Nuovo rivale: Livello ${event.newLevel} — ${BOT_LEVELS[event.newLevel].label}.`
          : `Il Rivale ti viene incontro: riparti dal Livello ${event.newLevel}.`;
  return (
    <p className="animate-pop-in rounded-lg border border-primary/30 bg-primary/10 p-3 text-center text-sm font-medium">
      {text}
    </p>
  );
}

export default function PlayPage() {
  const game = useGameController();
  const player = usePlayer();

  // "official" = calibrazione o sfida al Rivale (conta per la progressione);
  // "custom" = livello scelto a mano (non conta).
  const [gameKind, setGameKind] = React.useState<"official" | "custom">("official");
  const [customSetup, setCustomSetup] = React.useState(false);
  const [missionOutcome, setMissionOutcome] = React.useState<MissionOutcome | null>(null);
  const recordedRef = React.useRef(false);

  const calibrated = player.profile?.rivalLevel != null;
  const officialLevel: BotLevelId | null = player.profile
    ? (player.profile.rivalLevel ?? player.profile.calibrationLevel)
    : null;

  const startOfficial = () => {
    if (officialLevel === null) return;
    recordedRef.current = false;
    setMissionOutcome(null);
    setGameKind("official");
    player.beginGame();
    const color: PieceColor = Math.random() < 0.5 ? "w" : "b";
    game.startGame(color, officialLevel);
  };

  const startCustom = (color: PieceColor, level: BotLevelId) => {
    recordedRef.current = false;
    setMissionOutcome(null);
    setGameKind("custom");
    player.beginGame();
    game.startGame(color, level);
  };

  // Fine partita ufficiale: registra l'esito per calibrazione/Rivale (una volta).
  React.useEffect(() => {
    if (game.phase !== "finished" || !game.result || recordedRef.current) return;
    if (gameKind !== "official") return;
    recordedRef.current = true;
    void player.recordOutcome(playerOutcome(game.result, game.playerColor));
  }, [game.phase, game.result, game.playerColor, gameKind, player]);

  // Review pronta: verifica la missione (una volta) e, se compiuta, disattivala.
  React.useEffect(() => {
    if (game.phase !== "review" || !game.analysis || !game.result) return;
    if (missionOutcome !== null || !player.mission) return;
    const outcome = evaluateMission(player.mission, {
      sanMoves: game.historySan,
      playerColor: game.playerColor,
      result: game.result,
      moments: game.analysis,
    });
    setMissionOutcome(outcome);
    if (outcome === "success") void player.completeMission();
  }, [
    game.phase,
    game.analysis,
    game.result,
    game.historySan,
    game.playerColor,
    missionOutcome,
    player,
  ]);

  if (game.phase === "setup") {
    if (player.loading) {
      return <p className="py-10 text-center text-sm text-muted-foreground">Caricamento…</p>;
    }

    if (customSetup) {
      return (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setCustomSetup(false)}>
            ← Torna alla sfida
          </Button>
          <SetupScreen onStart={startCustom} />
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {!calibrated ? (
          <Card className="border-primary/40">
            <CardContent className="space-y-3 p-5">
              <h1 className="text-xl font-bold">Scopriamo il tuo livello</h1>
              <p className="text-sm text-muted-foreground">
                {CALIBRATION_TOTAL_GAMES} partite di calibrazione: il bot si adatta a come giochi e
                alla fine ti assegniamo il tuo <strong>Rivale</strong> personale — l&apos;avversario
                giusto per migliorare.
              </p>
              <p className="text-sm text-muted-foreground">
                Partita {Math.min(player.profile!.calibrationGames + 1, CALIBRATION_TOTAL_GAMES)} di{" "}
                {CALIBRATION_TOTAL_GAMES} · si parte dal Livello {player.profile!.calibrationLevel}.
              </p>
              <Button size="lg" className="w-full" onClick={startOfficial}>
                {player.profile!.calibrationGames === 0
                  ? "Inizia la calibrazione"
                  : "Prossima partita di calibrazione"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/40">
            <CardContent className="space-y-3 p-5">
              <h1 className="text-xl font-bold">
                Il tuo Rivale: Livello {player.profile!.rivalLevel} ·{" "}
                {BOT_LEVELS[player.profile!.rivalLevel!].label}
              </h1>
              <p className="text-sm text-muted-foreground">
                {BOT_LEVELS[player.profile!.rivalLevel!].description} Battilo con costanza e salirà
                di livello.
              </p>
              {player.mission && (
                <p className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-sm">
                  🎯 Missione di questa partita:{" "}
                  <span className="font-medium">{player.mission.text}</span>
                </p>
              )}
              <Button size="lg" className="w-full" onClick={startOfficial}>
                Sfida il Rivale
              </Button>
            </CardContent>
          </Card>
        )}

        <button
          type="button"
          onClick={() => setCustomSetup(true)}
          className="block w-full text-center text-sm text-muted-foreground underline hover:text-foreground"
        >
          Preferisci scegliere tu livello e colore? Partita libera (non conta per il Rivale)
        </button>
      </div>
    );
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
        botLevelLabel={
          gameKind === "official" && !calibrated
            ? `Calibrazione · Livello ${game.botLevel}`
            : `Livello ${game.botLevel} · ${BOT_LEVELS[game.botLevel].label}`
        }
        missionText={gameKind === "official" ? player.mission?.text : undefined}
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
        finalFen={game.fen}
        lastMove={game.lastMove}
        engineError={game.engineError}
        banner={player.lastEvent ? <ProgressionBanner event={player.lastEvent} /> : undefined}
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

        {gameKind === "official" && player.mission && missionOutcome === "success" && (
          <p className="animate-pop-in rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm font-medium">
            ✅ Missione compiuta! {player.mission.successText}
          </p>
        )}
        {gameKind === "official" && player.mission && missionOutcome === "fail" && (
          <p className="rounded-lg bg-secondary p-3 text-sm">
            🎯 Missione &quot;{player.mission.text}&quot;: non stavolta. Ci riproviamo nella
            prossima partita.
          </p>
        )}

        <ReviewPanel
          moments={game.analysis}
          intentions={game.intentions}
          feedbacks={game.feedbacks}
          playerColor={game.playerColor}
          onSetIntention={game.setIntention}
          onFeedback={game.setFeedback}
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
