const rawBaseUrl = import.meta.env.VITE_BASE_URL;

const normalizedBaseUrl =
  typeof rawBaseUrl === "string" && rawBaseUrl.trim().length > 0 ? rawBaseUrl : undefined;

export const clientOrigin = (
  normalizedBaseUrl ?? (typeof window !== "undefined" ? window.location.origin : "")
).replace(/\/$/, "");

console.log("clientOrigin", clientOrigin);
