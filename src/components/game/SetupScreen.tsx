"use client";

import * as React from "react";
import type { BotLevelId, PieceColor } from "@/lib/types";
import { BOT_LEVELS, toBotLevelId } from "@/lib/bot";
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

const ALL_LEVELS: BotLevelId[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [color, setColor] = React.useState<PieceColor>("w");
  const [level, setLevel] = React.useState<BotLevelId>(2);
  const config = BOT_LEVELS[level];

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
        <h2 className="text-sm font-semibold text-muted-foreground">
          Scegli il livello del bot (0–10)
        </h2>
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tabular-nums">Livello {level}</span>
              <span className="font-semibold text-primary">{config.label}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={level}
              onChange={(event) => setLevel(toBotLevelId(Number(event.target.value)))}
              className="w-full accent-primary"
              aria-label="Livello del bot"
              aria-valuetext={`Livello ${level}: ${config.label}`}
            />
            <div className="flex justify-between">
              {ALL_LEVELS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLevel(value)}
                  aria-label={`Livello ${value}`}
                  className={cn(
                    "w-6 rounded text-center text-xs tabular-nums text-muted-foreground hover:text-foreground",
                    value === level && "font-bold text-primary",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </CardContent>
        </Card>
      </section>

      <Button size="lg" className="w-full" onClick={() => onStart(color, level)}>
        Inizia la partita
      </Button>
    </div>
  );
}
