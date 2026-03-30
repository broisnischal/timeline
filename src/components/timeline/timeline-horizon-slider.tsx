import { useNavigate } from "@tanstack/react-router";
import { getRouteApi } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { defaultHorizon } from "@/lib/timeline/app-search";

const appRouteApi = getRouteApi("/_auth/app");

export function TimelineHorizonSlider() {
  const navigate = useNavigate();
  const search = appRouteApi.useSearch();
  const horizon = search.horizon ?? defaultHorizon;
  const [localHorizon, setLocalHorizon] = useState(horizon);

  useEffect(() => {
    setLocalHorizon(horizon);
  }, [horizon]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Planning window
          </Label>
          <p className="text-sm font-medium text-foreground tabular-nums transition-opacity duration-200">
            Next <span className="text-lg font-semibold tracking-tight">{localHorizon}</span>{" "}
            <span className="text-sm font-normal text-muted-foreground">days</span>
          </p>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            Includes the past week for context. Drag the handle, release to apply.
          </p>
        </div>
      </div>
      <Slider
        value={[localHorizon]}
        min={14}
        max={90}
        step={1}
        onValueChange={(value) => {
          const v = Array.isArray(value) ? value[0] : value;
          if (typeof v === "number") setLocalHorizon(v);
        }}
        onValueCommitted={(value) => {
          const v = Array.isArray(value) ? value[0] : value;
          if (typeof v !== "number") return;
          void navigate({
            to: "/app/timeline",
            search: (prev) => ({ ...prev, horizon: v }),
            replace: true,
          });
        }}
        className="max-w-md"
      />
      <div className="flex max-w-md justify-between text-[10px] tracking-tight text-muted-foreground tabular-nums">
        <span>2 wks</span>
        <span>3 mo</span>
      </div>
    </div>
  );
}
