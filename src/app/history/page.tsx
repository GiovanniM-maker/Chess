"use client";

import * as React from "react";
import Link from "next/link";
import { deleteGame, listGames } from "@/lib/storage";
import { resolveBotLevel } from "@/lib/bot";
import { formatDate, outcomeTitle, playerOutcome } from "@/lib/format";
import type { SavedGame } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function HistoryPage() {
  const [games, setGames] = React.useState<SavedGame[] | null>(null);

  const refresh = React.useCallback(async () => {
    setGames(await listGames());
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const onDelete = async (id: string) => {
    await deleteGame(id);
    await refresh();
  };

  if (games === null) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Caricamento…</p>;
  }

  if (games.length === 0) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-muted-foreground">Non hai ancora salvato nessuna partita.</p>
        <Link href="/play" className={buttonVariants({})}>
          Gioca la prima partita
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Storico partite</h1>
      <div className="space-y-3">
        {games.map((game) => {
          const outcome = playerOutcome(game.result, game.playerColor);
          return (
            <Card key={game.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{outcomeTitle(outcome)}</span>
                    <Badge variant="secondary">{resolveBotLevel(game.botLevel).label}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(game.createdAt)} · {game.moves.length} mosse ·{" "}
                    {game.playerColor === "w" ? "Bianco" : "Nero"}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/history/${game.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Apri
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(game.id)}
                    aria-label="Elimina partita"
                  >
                    Elimina
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
