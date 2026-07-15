"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getGame, updateGameIntention } from "@/lib/storage";
import { resolveBotLevel } from "@/lib/bot";
import { formatDate, outcomeTitle, playerOutcome, reasonLabel } from "@/lib/format";
import type { IntentionValue, SavedGame } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewPanel } from "@/components/game/ReviewPanel";
import { ReplayView } from "@/components/game/ReplayView";

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [game, setGame] = React.useState<SavedGame | null | undefined>(undefined);
  const [intentions, setIntentions] = React.useState<Record<string, IntentionValue>>({});
  const [replayMomentId, setReplayMomentId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    void getGame(id).then((loaded) => {
      if (!active) return;
      setGame(loaded ?? null);
      setIntentions(loaded?.intentions ?? {});
    });
    return () => {
      active = false;
    };
  }, [id]);

  const onSetIntention = (momentId: string, value: IntentionValue) => {
    setIntentions((prev) => ({ ...prev, [momentId]: value }));
    void updateGameIntention(id, momentId, value);
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

  const outcome = playerOutcome(game.result, game.playerColor);

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
            {resolveBotLevel(game.botLevel).label} · {formatDate(game.createdAt)} ·{" "}
            {reasonLabel(game.result.reason)}
          </p>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold">Review</h2>
      <ReviewPanel
        moments={moments}
        intentions={intentions}
        playerColor={game.playerColor}
        onSetIntention={onSetIntention}
        onOpenReplay={setReplayMomentId}
      />
    </div>
  );
}
