"use client";

import * as React from "react";
import type { BotLevelId, PieceColor } from "@/lib/types";
import { BOT_LEVEL_LIST } from "@/lib/bot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SetupScreenProps {
  onStart: (color: PieceColor, level: BotLevelId) => void;
}

const COLOR_OPTIONS: { value: PieceColor; label: string }[] = [
  { value: "w", label: "Bianco" },
  { value: "b", label: "Nero" },
];

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [color, setColor] = React.useState<PieceColor>("w");
  const [level, setLevel] = React.useState<BotLevelId>("beginner-absolute");

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Scegli il colore</h2>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={color === option.value}
              onClick={() => setColor(option.value)}
              className={cn(
                "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                color === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-accent",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Scegli il livello del bot</h2>
        <div className="space-y-2">
          {BOT_LEVEL_LIST.map((bot) => (
            <button
              key={bot.id}
              type="button"
              aria-pressed={level === bot.id}
              onClick={() => setLevel(bot.id)}
              className="w-full text-left"
            >
              <Card
                className={cn(
                  "transition-colors",
                  level === bot.id ? "border-primary ring-1 ring-primary" : "hover:bg-accent",
                )}
              >
                <CardContent className="p-4">
                  <div className="font-semibold">{bot.label}</div>
                  <div className="text-sm text-muted-foreground">{bot.description}</div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </section>

      <Button size="lg" className="w-full" onClick={() => onStart(color, level)}>
        Inizia la partita
      </Button>
    </div>
  );
}
