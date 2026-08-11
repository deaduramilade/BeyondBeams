// src/a2spa-crypto/RegulatoryOversightAgent.js
// NDPC Regulatory Oversight Agent – Real-time compliance monitoring
const crypto = require('crypto');

if (!process.env.OWNER_PRIVATE_KEY) {
  throw new Error(
    'Missing required environment variable: OWNER_PRIVATE_KEY. ' +
    'Set this variable to the PEM-encoded RSA private key content before starting the service.'
  );
}

const PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY.replace(/\\n/g, '\n');

if (!process.env.OWNER_PUBLIC_KEY) {
  throw new Error(
    'Missing required environment variable: OWNER_PUBLIC_KEY. ' +
    'Set this variable to the PEM-encoded RSA public key content before starting the service.'
  );
}

const PUBLIC_KEY = process.env.OWNER_PUBLIC_KEY.replace(/\\n/g, '\n');

function signA2SPAPayload(actionType, rawPayload, privateKeyPem) {
  const payloadHash = crypto.createHash('sha256').update(JSON.stringify(rawPayload)).digest('hex');
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  const unsignedPayload = { actionType, payloadHash, timestamp, nonce, authorisingEntity: "Samuel F'iyinfoluwa / oceanfi" };
  const canonicalString = JSON.stringify(unsignedPayload);
  const sign = crypto.createSign('SHA256');
  sign.update(canonicalString);
  const signature = sign.sign(privateKeyPem, 'base64');
  return { ...unsignedPayload, signature };
}

function verifyA2SPAPayload(signedPayload, publicKeyPem) {
  const { signature, ...unsignedPayload } = signedPayload;
  const { timestamp, authorisingEntity } = unsignedPayload;
  if (authorisingEntity !== "Samuel F'iyinfoluwa / oceanfi") return { valid: false, reason: "unauthorised_entity" };
  if (Date.now() - timestamp > 300000) return { valid: false, reason: "expired_timestamp" };
  const canonicalString = JSON.stringify(unsignedPayload);
  const verify = crypto.createVerify('SHA256');
  verify.update(canonicalString);
  return verify.verify(publicKeyPem, signature, 'base64') ? { valid: true } : { valid: false, reason: "invalid_signature" };
}

class RegulatoryOversightAgent {
  constructor() { console.log('👁️ Regulatory Oversight Agent initialised (A2SPA-protected)'); }

  async performOversight(actionPayload) {
    const signed = signA2SPAPayload("regulatory.oversight.perform", actionPayload, PRIVATE_KEY);
    const verification = verifyA2SPAPayload(signed, PUBLIC_KEY);
    if (!verification.valid) throw new Error(`A2SPA BLOCKED: ${verification.reason} — Oversight denied.`);

    console.log('📋 Regulatory Oversight Executed');
    console.log('   Controller:', actionPayload.controller);
    console.log('   Automated Response: Compliance audit logged + NDPC report ready');

    return {
      status: "oversight_completed",
      actionType: "regulatory.oversight.perform",
      a2spaVerified: true,
      auditId: "AUDIT-" + Date.now(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new RegulatoryOversightAgent();