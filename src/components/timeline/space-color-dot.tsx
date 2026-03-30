import { isHexColor } from "@/lib/timeline/task-appearance";
import { cn } from "@/lib/utils";

export function SpaceColorDot({ color }: { readonly color: string | null | undefined }) {
  const hex = isHexColor(color) ? color : null;
  return (
    <span
      className={cn(
        "size-2 shrink-0 rounded-full ring-1 ring-border/70 ring-inset",
        !hex && "bg-muted-foreground/25",
      )}
      style={hex ? { backgroundColor: hex } : undefined}
      aria-hidden
    />
  );
}
