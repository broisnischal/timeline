/** Public repo or org link for “GitHub” in the app menu. Override with `VITE_GITHUB_URL`. */
export const SITE_GITHUB_URL =
  (import.meta.env.VITE_GITHUB_URL as string | undefined) ?? "https://github.com/tanstack/tanstack";

/** App shell: toggle light ↔ dark (uses current `dark` class on `html`). Distinct from Mod+Shift+T (Timeline). */
export const THEME_TOGGLE_HOTKEY = "Mod+Alt+T";
