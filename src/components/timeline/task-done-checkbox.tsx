import type { ComponentProps } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Props = ComponentProps<typeof Checkbox>;

/** Done/todo checkbox with press feedback for timeline and task detail. */
export function TaskDoneCheckbox({ className, disabled, ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-lg p-0.5 transition-[transform,opacity] duration-150 ease-out will-change-transform",
        "active:scale-[0.88] active:opacity-[0.92]",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        disabled && "pointer-events-none opacity-55",
      )}
    >
      <Checkbox
        disabled={disabled}
        className={cn(
          "transition-[transform,box-shadow] duration-200 ease-out",
          "data-checked:shadow-[0_0_0_2px_hsl(var(--primary)_/_0.22)]",
          className,
        )}
        {...props}
      />
    </span>
  );
}
