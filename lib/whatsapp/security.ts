import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const ENCRYPTION_ENV = "WHATSAPP_TOKEN_ENCRYPTION_KEY";

export function verifyMetaSignature(
  rawBody: string | Buffer,
  signature: string | null,
  appSecret: string
): boolean {
  if (!appSecret || !signature) return false;
  const match = /^sha256=([a-f0-9]{64})$/i.exec(signature.trim());
  if (!match) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  const received = Buffer.from(match[1], "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function encryptionKey(): Buffer {
  const raw = process.env[ENCRYPTION_ENV]?.trim();
  if (!raw) throw new Error(`${ENCRYPTION_ENV} is required`);

  const key = /^[a-f0-9]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(`${ENCRYPTION_ENV} must encode exactly 32 bytes (64 hex characters or base64)`);
  }
  return key;
}

export function encryptWhatsAppToken(plaintext: string): string {
  if (!plaintext) throw new Error("WhatsApp token cannot be empty");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptWhatsAppToken(encoded: string): string {
  const [version, ivPart, tagPart, ciphertextPart, extra] = encoded.split(".");
  if (version !== "v1" || !ivPart || !tagPart || ciphertextPart === undefined || extra !== undefined) {
    throw new Error("Unsupported encrypted WhatsApp token format");
  }

  const iv = Buffer.from(ivPart, "base64url");
  const tag = Buffer.from(tagPart, "base64url");
  const ciphertext = Buffer.from(ciphertextPart, "base64url");
  if (iv.length !== 12 || tag.length !== 16) throw new Error("Invalid encrypted WhatsApp token");

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
