import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const modes = [
  { key: "light" as const, label: "Light theme", Icon: SunIcon },
  { key: "dark" as const, label: "Dark theme", Icon: MoonIcon },
  { key: "system" as const, label: "System theme", Icon: MonitorIcon },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="inline-flex rounded-full bg-muted/50 p-0.5 ring-1 ring-border/40"
      role="group"
      aria-label="Theme"
    >
      {modes.map(({ key, label, Icon }) => {
        const active = theme === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setTheme(key)}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              "relative rounded-full p-1.5 transition-[color,background-color,box-shadow,transform] duration-200 ease-out",
              active
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/45"
                : "text-muted-foreground hover:text-foreground",
              "hover:enabled:scale-[1.03] active:enabled:scale-[0.98]",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
