import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY environment variable is required");
  // Key must be 32 bytes for AES-256. Hash the env var to ensure correct length.
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt a plaintext string.
 * Returns base64-encoded string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt an encrypted string.
 * Expects base64-encoded string: iv:authTag:ciphertext
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText;
  try {
    const key = getKey();
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return encryptedText; // Not encrypted, return as-is
    const iv = Buffer.from(parts[0], "base64");
    const authTag = Buffer.from(parts[1], "base64");
    const ciphertext = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    // If decryption fails (e.g. data was stored before encryption was enabled),
    // return the original text
    return encryptedText;
  }
}

/**
 * Encrypt sensitive transaction fields.
 */
export function encryptTransactionData(data: {
  rawDescription: string;
  cleanedDescription?: string | null;
}): { rawDescription: string; cleanedDescription: string | null } {
  return {
    rawDescription: encrypt(data.rawDescription),
    cleanedDescription: data.cleanedDescription
      ? encrypt(data.cleanedDescription)
      : null,
  };
}

/**
 * Decrypt sensitive transaction fields.
 */
export function decryptTransactionData<
  T extends { rawDescription: string; cleanedDescription?: string | null }
>(txn: T): T {
  return {
    ...txn,
    rawDescription: decrypt(txn.rawDescription),
    cleanedDescription: txn.cleanedDescription
      ? decrypt(txn.cleanedDescription)
      : txn.cleanedDescription,
  };
}
