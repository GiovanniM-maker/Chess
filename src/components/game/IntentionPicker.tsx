import type { IntentionValue } from "@/lib/types";
import { INTENTION_LABELS, INTENTION_OPTIONS } from "@/lib/analysis";
import { cn } from "@/lib/utils";

export interface IntentionPickerProps {
  value: IntentionValue | undefined;
  onChange: (value: IntentionValue) => void;
}

/** Selettore dell'intenzione dichiarata dal giocatore su un momento. */
export function IntentionPicker({ value, onChange }: IntentionPickerProps) {
  return (
    <div
      role="group"
      aria-label="Cosa volevi ottenere con questa mossa?"
      className="flex flex-wrap gap-2"
    >
      {INTENTION_OPTIONS.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-accent",
            )}
          >
            {INTENTION_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
