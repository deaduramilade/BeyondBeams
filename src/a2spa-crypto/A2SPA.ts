// src/a2spa-crypto/A2SPA.ts
// Oblivion-AI A2SPA (Agent-to-Secure Payload Authorization) Module
// "No signature, no execution." — Zero-Trust execution boundary
// Prototype only; not evidence of legal compliance or production readiness

import * as crypto from 'crypto';

export interface A2SPAPayload {
  actionType: string;           // e.g. "compliance.dpia.generate", "rights.forget"
  payloadHash: string;          // SHA-256 hash of the actual payload
  timestamp: number;            // Unix timestamp (ms)
  nonce: string;                // Unique nonce (prevents replay)
  authorisingEntity: string;    // Always "Samuel F'iyinfoluwa / oceanfi"
  verificationOutcomes?: string[]; // e.g. ["key_valid", "nonce_fresh"]
}

export interface A2SPASignedPayload extends A2SPAPayload {
  signature: string;            // ECDSA signature (base64)
}

/**
 * Generate a cryptographically signed A2SPA payload.
 * Uses ECDSA P-256 (secure, standard, cross-platform).
 */
export async function signA2SPAPayload(
  actionType: string,
  rawPayload: any,                    // any data being authorised
  privateKeyPem: string,              // Owner's private key (securely stored)
  authorisingEntity = "Samuel F'iyinfoluwa / oceanfi"
): Promise<A2SPASignedPayload> {
  const payloadHash = crypto.createHash('sha256')
    .update(JSON.stringify(rawPayload))
    .digest('hex');

  const timestamp = Date.now();
  const nonce = crypto.randomUUID();

  const unsignedPayload: A2SPAPayload = {
    actionType,
    payloadHash,
    timestamp,
    nonce,
    authorisingEntity,
  };

  // Create canonical string for signing
  const canonicalString = JSON.stringify(unsignedPayload);

  const sign = crypto.createSign('SHA256');
  sign.update(canonicalString);
  const signature = sign.sign(privateKeyPem, 'base64');

  return {
    ...unsignedPayload,
    signature,
  };
}

/**
 * Verify an A2SPA signed payload. Returns true only if EVERY check passes.
 * Enforces: "No signature, no execution."
 */
export function verifyA2SPAPayload(
  signedPayload: A2SPASignedPayload,
  publicKeyPem: string,
  maxAgeMs = 300000 // 5 minutes default
): { valid: boolean; reason?: string } {
  const { signature, timestamp, nonce, authorisingEntity, ...unsigned } = signedPayload;

  // 1. Authorising entity must match owner
  if (authorisingEntity !== "Samuel F'iyinfoluwa / oceanfi") {
    return { valid: false, reason: "unauthorised_entity" };
  }

  // 2. Timestamp freshness (replay protection)
  if (Date.now() - timestamp > maxAgeMs) {
    return { valid: false, reason: "expired_timestamp" };
  }

  // 3. Rebuild canonical string and verify signature
  const canonicalString = JSON.stringify(unsigned);
  const verify = crypto.createVerify('SHA256');
  verify.update(canonicalString);

  const isSignatureValid = verify.verify(publicKeyPem, signature, 'base64');

  if (!isSignatureValid) {
    return { valid: false, reason: "invalid_signature" };
  }

  // 4. Future: Add nonce storage check (Redis/DB) for strict replay protection

  return { valid: true };
}

// Example usage (for GitHub Copilot to expand):
// const signed = await signA2SPAPayload("compliance.dpia.generate", dpiadata, privateKey);
// const result = verifyA2SPAPayload(signed, publicKey);
// if (!result.valid) throw new Error(`A2SPA blocked: ${result.reason}`);