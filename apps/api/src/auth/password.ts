import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, KEY_LENGTH).toString("hex")}`;
}

export function verifyPassword(password: string, encoded?: string | null) {
  if (!encoded) return false;
  const [algorithm, salt, expectedHex] = encoded.split(":");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
