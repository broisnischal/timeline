import "@tanstack/react-start/server-only";

function hexFromBuffer(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Hex(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return hexFromBuffer(digest);
}

const PREFIX = "tln_mcp_";

export function generateMcpSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${PREFIX}${suffix}`;
}

export function keyDisplayPrefix(secret: string, visibleChars = 18): string {
  if (secret.length <= visibleChars) return `${secret}…`;
  return `${secret.slice(0, visibleChars)}…`;
}
