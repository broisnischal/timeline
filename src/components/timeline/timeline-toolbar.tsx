import { useHotkeys } from "@tanstack/react-hotkeys";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { AppSearch } from "@/lib/timeline/app-search";
import {
  TIMELINE_RANGE_PRESETS,
  type TimelineRangePreset,
  timelineRangePresetLabel,
} from "@/lib/timeline/range";
import { cn } from "@/lib/utils";

const SEARCH_INPUT_ID = "timeline-toolbar-search";

const RANGE_SHORT: Record<TimelineRangePreset, string> = {
  "2w": "2w",
  "1m": "1m",
  "3m": "3m",
  all: "All",
};

export function TimelineToolbar({ search }: { readonly search: AppSearch }) {
  const navigate = useNavigate();
  const activeRange: TimelineRangePreset = search.range ?? "1m";
  const [q, setQ] = useState(search.q ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hintId = useId();

  const focusSearch = useCallback(() => {
    const el = inputRef.current ?? document.getElementById(SEARCH_INPUT_ID);
    if (el instanceof HTMLInputElement) {
      el.focus();
      el.select();
    }
  }, []);

  useHotkeys([{ hotkey: "Mod+F", callback: () => focusSearch() }], { preventDefault: true });

  useHotkeys(
    [
      {
        hotkey: "Escape",
        callback: () => {
          const el = inputRef.current ?? document.getElementById(SEARCH_INPUT_ID);
          if (el instanceof HTMLInputElement && document.activeElement === el) {
            el.blur();
          }
        },
      },
    ],
    { preventDefault: false },
  );

  useEffect(() => {
    // oxlint-disable-next-line react-hooks-js/set-state-in-effect -- sync local field to URL search param
    setQ(search.q ?? "");
  }, [search.q]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = q.trim();
      const cur = (search.q ?? "").trim();
      if (next === cur) return;
      void navigate({
        to: "/app/timeline",
        search: { ...search, q: next || undefined },
        replace: true,
      });
    }, 320);
    return () => window.clearTimeout(t);
  }, [q, navigate, search]);

  const setRange = (range: TimelineRangePreset) => {
    void navigate({
      to: "/app/timeline",
      search: { ...search, range },
      replace: true,
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="relative min-w-0 flex-1">
        <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
          Search tasks
        </label>
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground/65"
          aria-hidden
        />
        <Input
          ref={inputRef}
          id={SEARCH_INPUT_ID}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          autoComplete="off"
          title="Focus search — ⌘F or Ctrl+F"
          aria-describedby={hintId}
          className={cn(
            "h-9 rounded-full border border-border/50 bg-muted/15 py-1 pr-17 pl-9 text-sm shadow-none",
            "placeholder:text-muted-foreground/70",
            "focus-visible:border-border focus-visible:ring-1 focus-visible:ring-ring/35",
          )}
        />
        <span
          id={hintId}
          className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 sm:flex"
        >
          <KbdGroup className="opacity-60">
            <Kbd className="h-4 min-w-6 px-1 text-[10px]">Ctrl</Kbd>
            <Kbd className="h-4 min-w-4.5 px-1 text-[10px]">F</Kbd>
          </KbdGroup>
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-9 shrink-0 gap-1.5 rounded-full border-border/50 bg-muted/15 px-3 font-normal shadow-none",
                "hover:bg-muted/35",
              )}
              aria-label="Date range"
            />
          }
        >
          <span className="text-xs text-foreground tabular-nums">{RANGE_SHORT[activeRange]}</span>
          <ChevronDownIcon className="size-3.5 opacity-55" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuGroup>
            <DropdownMenuRadioGroup
              value={activeRange}
              onValueChange={(v) => setRange(v as TimelineRangePreset)}
            >
              {TIMELINE_RANGE_PRESETS.map((preset) => (
                <DropdownMenuRadioItem key={preset} value={preset} className="cursor-pointer">
                  <span className="flex w-full items-center justify-between gap-3">
                    <span>{timelineRangePresetLabel(preset)}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {RANGE_SHORT[preset]}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
