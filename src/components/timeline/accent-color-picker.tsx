import { Button } from "@/components/ui/button";
import { ACCENT_PRESETS, isHexColor } from "@/lib/timeline/task-appearance";
import { cn } from "@/lib/utils";

function canonicalHex(s: string | null | undefined): string | null {
  if (!s || !isHexColor(s)) return null;
  return s.toLowerCase();
}

type AccentColorPickerProps = {
  readonly value: string | null;
  readonly onChange: (next: string | null) => void;
  /** Shown on the clear row (e.g. "No color" / "Use space color"). */
  readonly clearLabel: string;
  /** Tighter layout for small dialogs. */
  readonly compact?: boolean;
};

export function AccentColorPicker({
  value,
  onChange,
  clearLabel,
  compact = false,
}: AccentColorPickerProps) {
  const current = canonicalHex(value);
  const presets =
    current && !(ACCENT_PRESETS as readonly string[]).includes(current)
      ? [current, ...ACCENT_PRESETS]
      : [...ACCENT_PRESETS];

  return (
    <div className={cn("space-y-2", !compact && "space-y-2.5")}>
      <div className={cn("grid grid-cols-6", compact ? "gap-1" : "gap-1.5")}>
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            className={cn(
              "shrink-0 rounded-md ring-1 ring-black/15 transition-[transform,box-shadow] hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:ring-white/20",
              compact ? "size-5" : "size-6",
              current === c &&
                "ring-2 ring-foreground/40 ring-offset-1 ring-offset-popover dark:ring-offset-popover",
            )}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
            aria-label={`Color ${c}`}
            aria-pressed={current === c}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-7 w-full rounded-md text-xs font-normal text-muted-foreground hover:text-foreground",
          value === null && "bg-muted/50 text-foreground",
        )}
        onClick={() => onChange(null)}
      >
        {clearLabel}
      </Button>
    </div>
  );
}
