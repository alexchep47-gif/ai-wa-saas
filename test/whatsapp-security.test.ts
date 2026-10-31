import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import {
  decryptWhatsAppToken,
  encryptWhatsAppToken,
  verifyMetaSignature,
} from "../lib/whatsapp/security";
import { verifyWebhook } from "../lib/whatsapp/cloud";

const rawBody = '{"object":"whatsapp_business_account","entry":[]}';
const appSecret = "test-meta-app-secret";
const signature = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;

test("accepts only a valid Meta HMAC signature for the exact raw body", () => {
  assert.equal(verifyMetaSignature(rawBody, signature, appSecret), true);
  assert.equal(verifyMetaSignature(`${rawBody} `, signature, appSecret), false);
  assert.equal(verifyMetaSignature(rawBody, null, appSecret), false);
  assert.equal(verifyMetaSignature(rawBody, signature, ""), false);
  assert.equal(verifyMetaSignature(rawBody, "sha256=bad", appSecret), false);
});

test("does not accept the webhook challenge when the verify token is missing", () => {
  assert.equal(verifyWebhook("subscribe", "", "challenge", ""), null);
  assert.equal(verifyWebhook("subscribe", "wrong", "challenge", "expected"), null);
  assert.equal(verifyWebhook("subscribe", "expected", "challenge", "expected"), "challenge");
});

test("encrypts WhatsApp tokens so the stored value is not plaintext and round-trips", () => {
  process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY = "11".repeat(32);
  const token = "EAA-test-token-that-must-not-be-stored-in-plain-text";
  const encrypted = encryptWhatsAppToken(token);
  assert.notEqual(encrypted, token);
  assert.equal(decryptWhatsAppToken(encrypted), token);
});

test("authenticated encryption rejects tampering", () => {
  process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY = "22".repeat(32);
  const encrypted = encryptWhatsAppToken("secret-token");
  const parts = encrypted.split(".");
  parts[3] = Buffer.from("tampered", "utf8").toString("base64url");
  assert.throws(() => decryptWhatsAppToken(parts.join(".")));
});
