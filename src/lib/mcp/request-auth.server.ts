import "@tanstack/react-start/server-only";
import { sha256Hex } from "./key-crypto.server";
import { getMcpKeyByHash, touchMcpKeyLastUsed } from "./repo.server";

export async function getUserIdFromMcpBearer(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const keyHash = await sha256Hex(token);
  const row = await getMcpKeyByHash(keyHash);
  if (!row) return null;
  void touchMcpKeyLastUsed(row.id).catch(() => {});
  return row.userId;
}
