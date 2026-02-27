/**
 * AES-256-GCM encryption for sensitive DB fields (e.g. vapiApiKey).
 * Requires ENCRYPTION_KEY env var: 64 hex chars (32 bytes).
 *
 * Generate a key:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Encrypted values are stored as: enc:<IV>:<TAG>:<CIPHERTEXT> (all hex)
 * Plain values (no "enc:" prefix) are returned as-is for backward compatibility.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(key, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/** Decrypts an AES-256-GCM ciphertext. Returns plaintext as-is if not encrypted. */
export function decryptIfEncrypted(value: string): string {
  if (!value.startsWith("enc:")) return value; // legacy plaintext — return as-is
  const parts = value.split(":");
  if (parts.length !== 4) return value; // malformed — treat as plaintext
  const [, ivHex, tagHex, encHex] = parts;
  try {
    const key = getKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const enc = Buffer.from(encHex, "hex");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    console.error("[CRYPTO] Decryption failed — returning raw value");
    return value;
  }
}
