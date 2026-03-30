/** Matches server `keyDisplayPrefix` for client-side fingerprint after create/rotate. */
const VISIBLE_CHARS = 18;

export function mcpKeyFingerprint(secret: string): string {
  if (secret.length <= VISIBLE_CHARS) return `${secret}…`;
  return `${secret.slice(0, VISIBLE_CHARS)}…`;
}
