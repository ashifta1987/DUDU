import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Device secrets are random 32-byte values flashed onto the device at provisioning time.
 * The DB stores only HMAC-SHA256(pepper, secret); the pepper (GATEWAY_DEVICE_SECRET_PEPPER)
 * lives in the gateway environment, never in the database.
 */
export function generateDeviceSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function hashDeviceSecret(secret: string, pepper: string): string {
  if (!pepper || pepper.length < 16)
    throw new Error("GATEWAY_DEVICE_SECRET_PEPPER must be at least 16 characters");
  return createHmac("sha256", pepper).update(secret).digest("hex");
}

export function verifyDeviceSecret(secret: string, storedHash: string, pepper: string): boolean {
  const a = Buffer.from(hashDeviceSecret(secret, pepper), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
