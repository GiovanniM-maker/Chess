"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFriendGame, type ColorChoice } from "@/lib/p2p/use-friend-game";
import { Button, buttonVariants } from "@/components/ui/button";
import { PlayingScreen } from "@/components/game/PlayingScreen";
import { GameOverView } from "@/components/game/GameOverView";
import { cn } from "@/lib/utils";

const COLOR_OPTIONS: { value: ColorChoice; label: string }[] = [
  { value: "w", label: "Bianco" },
  { value: "b", label: "Nero" },
  { value: "random", label: "Casuale" },
];

function FriendPageInner() {
  const searchParams = useSearchParams();
  const roomFromUrl = searchParams.get("room");
  const game = useFriendGame();
  const [colorChoice, setColorChoice] = React.useState<ColorChoice>("random");
  const [copied, setCopied] = React.useState(false);
  const joinedRef = React.useRef(false);

  // Se il link contiene una stanza, entra automaticamente come ospite.
  React.useEffect(() => {
    if (roomFromUrl && !joinedRef.current) {
      joinedRef.current = true;
      game.joinRoom(roomFromUrl);
    }
  }, [roomFromUrl, game]);

  const copyLink = async () => {
    if (!game.shareUrl) return;
    try {
      await navigator.clipboard.writeText(game.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // il campo di testo selezionabile sotto resta come fallback
    }
  };

  if (game.phase === "setup" && !roomFromUrl) {
    return (
      <div className="space-y-6">
        <section className="space-y-2">
          <h1 className="text-xl font-bold">Gioca con un amico</h1>
          <p className="text-sm text-muted-foreground">
            Crea la partita, invia il link al tuo amico e si entra subito in gioco: nessun account,
            la connessione è diretta tra i vostri dispositivi.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Il tuo colore</h2>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={colorChoice === option.value}
                onClick={() => setColorChoice(option.value)}
                className={cn(
                  "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                  colorChoice === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-accent",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
        <Button size="lg" className="w-full" onClick={() => game.createRoom(colorChoice)}>
          Crea la partita e genera il link
        </Button>
      </div>
    );
  }

  if (game.phase === "waiting") {
    return (
      <div className="space-y-4 py-6 text-center">
        <h1 className="text-xl font-bold">Invita il tuo amico</h1>
        {game.shareUrl ? (
          <>
            <p className="text-sm text-muted-foreground">
              Invia questo link: appena lo apre, la partita inizia.
            </p>
            <p className="select-all break-all rounded-lg border bg-muted/40 p-3 text-sm">
              {game.shareUrl}
            </p>
            <Button className="w-full" onClick={copyLink}>
              {copied ? "Copiato!" : "Copia il link"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Creo la stanza…</p>
        )}
        <div
          className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"
          role="status"
          aria-label="In attesa dell'amico"
        />
        <p className="text-sm text-muted-foreground">
          In attesa che il tuo amico entri… Tieni questa pagina aperta.
        </p>
      </div>
    );
  }

  if (game.phase === "connecting") {
    return (
      <div className="space-y-4 py-10 text-center">
        <div
          className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"
          role="status"
          aria-label="Connessione in corso"
        />
        <p className="text-sm text-muted-foreground">Mi collego alla partita del tuo amico…</p>
      </div>
    );
  }

  if (game.phase === "error") {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {game.errorMessage}
        </p>
        <Link href="/friend" className={buttonVariants({ variant: "outline" })}>
          Crea una nuova partita
        </Link>
      </div>
    );
  }

  if (game.phase === "playing") {
    const status = game.connectionLost
      ? "Avversario disconnesso…"
      : game.isMyTurn
        ? "Tocca a te"
        : "Mossa dell'avversario…";
    return (
      <div className="space-y-3">
        {game.connectionLost && (
          <p className="rounded-lg bg-destructive/10 p-2 text-center text-xs text-destructive">
            Connessione con l&apos;avversario persa. Se non rientra, puoi abbandonare la partita.
          </p>
        )}
        <PlayingScreen
          fen={game.fen}
          playerColor={game.myColor}
          lastMove={game.lastMove}
          isPlayerTurn={game.isMyTurn}
          isBotThinking={false}
          historySan={game.historySan}
          botLevelLabel="Amico (via link)"
          opponentShort="Amico"
          status={status}
          onMove={game.playMove}
          onResign={game.resign}
        />
      </div>
    );
  }

  if (game.phase === "finished" && game.result) {
    return (
      <GameOverView
        result={game.result}
        playerColor={game.myColor}
        finalFen={game.fen}
        lastMove={game.lastMove}
      >
        {game.savedGameId && (
          <Link
            href={`/history/${game.savedGameId}`}
            className={buttonVariants({ size: "lg", className: "w-full" })}
          >
            Rivedi e analizza la partita
          </Link>
        )}
        <Link
          href="/friend"
          className={buttonVariants({ variant: "outline", className: "w-full" })}
        >
          Nuova partita con un amico
        </Link>
      </GameOverView>
    );
  }

  return null;
}

export default function FriendPage() {
  // useSearchParams richiede un boundary di Suspense nell'App Router.
  return (
    <React.Suspense
      fallback={<p className="py-10 text-center text-sm text-muted-foreground">Caricamento…</p>}
    >
      <FriendPageInner />
    </React.Suspense>
  );
}
