import { ScriptOnce } from "@tanstack/react-router";
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light" | "system";
const MEDIA = "(prefers-color-scheme: dark)";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const isTheme = (value: unknown): value is Theme =>
  value === "dark" || value === "light" || value === "system";

const resolveTheme = (theme: Theme) =>
  theme === "system" ? (window.matchMedia(MEDIA).matches ? "dark" : "light") : theme;

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// references:
// https://ui.shadcn.com/docs/dark-mode/vite
// https://github.com/pacocoursey/next-themes/blob/main/next-themes/src/index.tsx
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const storedTheme = window.localStorage.getItem(storageKey);
    return isTheme(storedTheme) ? storedTheme : defaultTheme;
  });

  const handleMediaQuery = useCallback(
    (e: MediaQueryListEvent | MediaQueryList) => {
      if (theme !== "system") return;
      const root = window.document.documentElement;
      const targetTheme = e.matches ? "dark" : "light";
      root.classList.remove("light", "dark");
      root.classList.add(targetTheme);
    },
    [theme],
  );

  // Listen for system preference changes
  useEffect(() => {
    const media = window.matchMedia(MEDIA);

    media.addEventListener("change", handleMediaQuery);
    handleMediaQuery(media);

    return () => media.removeEventListener("change", handleMediaQuery);
  }, [handleMediaQuery]);

  useEffect(() => {
    const root = window.document.documentElement;
    const targetTheme = resolveTheme(theme);
    if (theme === "system") window.localStorage.removeItem(storageKey);
    else window.localStorage.setItem(storageKey, theme);
    root.classList.remove("light", "dark");
    root.classList.add(targetTheme);
  }, [theme, storageKey]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme],
  );

  return (
    <ThemeProviderContext {...props} value={value}>
      <ScriptOnce>
        {/* Apply theme early to avoid FOUC */}
        {`(function() {
          var storedTheme = localStorage.getItem('${storageKey}');
          var theme = storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
            ? storedTheme
            : '${defaultTheme}';
          var resolved = theme === 'system'
            ? (window.matchMedia('${MEDIA}').matches ? 'dark' : 'light')
            : theme;
          var root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(resolved);
        })()`}
      </ScriptOnce>
      {children}
    </ThemeProviderContext>
  );
}

export const useTheme = () => {
  const context = use(ThemeProviderContext);

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
