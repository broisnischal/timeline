import "@tanstack/react-start/server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { env } from "@/env/server";

function getKeyBytes() {
  const raw = env.NOTION_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("Missing NOTION_TOKEN_ENCRYPTION_KEY");
  }
  // Deterministic 32-byte key from arbitrary env input.
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKeyBytes(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptSecret(payload: string) {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted payload");
  }
  const decipher = createDecipheriv("aes-256-gcm", getKeyBytes(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return plain;
}
